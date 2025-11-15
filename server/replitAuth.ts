// Replit Auth integration - based on blueprint
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Custom error for authentication failures
export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const claims = tokens.claims();
    if (!claims) {
      return verified(new Error("No claims in token"));
    }
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertUser(claims);
    // Set the user ID for serialization
    user.id = claims.sub;
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  // Unified serialize/deserialize to work with both Replit Auth and Google OAuth
  passport.serializeUser((user: any, cb) => {
    // Store the entire user object to preserve tokens and claims for both providers
    cb(null, user);
  });

  passport.deserializeUser(async (user: any, cb) => {
    try {
      if (!user) {
        return cb(null, false);
      }
      
      // For Replit Auth: user has claims, expires_at, tokens
      // For Google OAuth: user has id, email, role directly
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        console.error("Deserialize: No valid user ID in session");
        return cb(null, false);
      }
      
      // Fetch fresh user data from database to get current role/permissions
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        console.error(`Deserialize: User not found for ID: ${userId}`);
        return cb(null, false);
      }
      
      // Merge database user data with session data (preserving tokens for both providers)
      const deserializedUser = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        googleId: dbUser.googleId,
        // Preserve Replit Auth session data if present
        claims: user.claims,
        // Preserve OAuth tokens (both Replit and Google)
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        expires_at: user.expires_at,
        // Preserve provider marker
        provider: user.provider,
      };
      
      cb(null, deserializedUser);
    } catch (error) {
      console.error("Deserialize error:", error);
      cb(error as Error);
    }
  });

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Unified authentication check - works with both Replit Auth and Google OAuth
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  
  // Verify we have a valid user ID from either provider
  const userId = user.id || user.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // For Google OAuth users: user.provider === 'google' or (user.id && !user.claims)
  // For Replit Auth users: user.claims exists and has expires_at
  const isGoogleOAuth = user.provider === 'google' || (user.id && !user.claims);
  const isReplitAuth = user.claims && user.expires_at;

  // Google OAuth users don't need token refresh (Passport handles it)
  if (isGoogleOAuth) {
    return next();
  }

  // Replit Auth users need token expiration check and refresh
  if (!isReplitAuth) {
    // Invalid session state - neither Google nor valid Replit Auth
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired, attempt refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Helper function to get user ID from request (works with both auth providers)
// Note: This should only be called after isAuthenticated middleware
export function getUserId(req: any): string {
  if (!req.user || typeof req.user !== 'object') {
    console.error("getUserId called without authenticated user");
    throw new UnauthorizedError();
  }
  const userId = req.user.id || req.user.claims?.sub;
  if (!userId) {
    console.error("getUserId: User object missing ID");
    throw new UnauthorizedError();
  }
  return userId;
}
