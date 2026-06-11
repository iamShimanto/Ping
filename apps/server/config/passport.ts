import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "@repo/config";
import User from "../models/auth/auth.models";

const SERVER_URL = env.SERVER_URL;

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"));

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            await user.save({ validateModifiedOnly: true });
          } else {
            user = await User.create({
              fullName: profile.displayName || email.split("@")[0],
              email,
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/api/v1/auth/github/callback`,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: any,
    ) => {
      try {
        const email =
          profile.emails?.find((e: any) => e.primary)?.value ||
          profile.emails?.[0]?.value;

        if (!email)
          return done(
            new Error(
              "No email from GitHub. Make sure your GitHub email is public.",
            ),
          );

        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          user = await User.findOne({ email });
          if (user) {
            user.githubId = String(profile.id);
            await user.save({ validateModifiedOnly: true });
          } else {
            user = await User.create({
              fullName:
                profile.displayName || profile.username || email.split("@")[0],
              email,
              githubId: String(profile.id),
              avatar: profile.photos?.[0]?.value,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

export default passport;
