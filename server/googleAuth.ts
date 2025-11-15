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
      async (accessToken, refreshToken, profile, done) => {
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

          let user;
          if (existingUsers.length > 0) {
            // User exists - update with Google ID if not already set
            user = existingUsers[0];
            if (!user.googleId) {
              const [updatedUser] = await db
                .update(users)
                .set({ googleId })
                .where(eq(users.email, email))
                .returning();
              user = updatedUser;
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
            user = newUser;
          }

          return done(null, user);
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
