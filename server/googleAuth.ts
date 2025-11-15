import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export function setupGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth not configured - skipping Google Auth setup");
    return false;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          const firstName = profile.name?.givenName || "User";
          const lastName = profile.name?.familyName || "";
          const googleId = profile.id;

          // Check if user exists by email
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          let dbUser;
          if (existingUsers.length > 0) {
            // User exists - update with Google ID if not already set
            dbUser = existingUsers[0];
            if (!dbUser.googleId) {
              const [updatedUser] = await db
                .update(users)
                .set({ googleId })
                .where(eq(users.email, email))
                .returning();
              dbUser = updatedUser;
            }
          } else {
            // Create new user with default homeowner role
            const [newUser] = await db
              .insert(users)
              .values({
                email,
                firstName,
                lastName,
                googleId,
                role: "homeowner", // Default role for new Google OAuth users
              })
              .returning();
            dbUser = newUser;
          }

          // Build user session object with OAuth tokens for API access
          const userSession = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            googleId: dbUser.googleId,
            // Store Google OAuth tokens for API access
            access_token: accessToken,
            refresh_token: refreshToken,
            provider: 'google', // Explicitly mark as Google OAuth
          };

          return done(null, userSession);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error as Error);
        }
      }
    )
  );

  console.log("Google OAuth configured successfully");
  return true;
}
