import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller";
import { oauthCallback } from "../../controllers/auth/oauth.controller";
import { asyncHandler } from "@repo/helpers";
import { rateLimit } from "../../utils/rateLimit";
import { authMiddleWare } from "../../middleware/auth.middleware";
import passport from "../../config/passport";
import multer from "multer";
const upload = multer();

const router = Router();

router.post(
  "/register",
  rateLimit({ limit: 10, windowSec: 5 * 60, keyPrefix: "rl:register" }),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  rateLimit({ limit: 10, windowSec: 5 * 60, keyPrefix: "rl:login" }),
  asyncHandler(authController.login),
);
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh", asyncHandler(authController.refreshToken));
router.get("/me", authMiddleWare, asyncHandler(authController.getCurrentUser));
router.post(
  "/change-password",
  authMiddleWare,
  asyncHandler(authController.changePassword),
);
router.post(
  "/forgot-password",
  rateLimit({ limit: 5, windowSec: 15 * 60, keyPrefix: "rl:forgot-pw" }),
  asyncHandler(authController.forgotPassword),
);
router.post("/reset-password", asyncHandler(authController.resetPassword));
router.put(
  "/update-profile",
  authMiddleWare,
  upload.single("avatar"),
  asyncHandler(authController.updateProfile),
);
router.patch(
  "/update-status",
  authMiddleWare,
  asyncHandler(authController.updateStatus),
);

// ─── Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth_failed" }),
  asyncHandler(oauthCallback)
);

// ─── GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login?error=oauth_failed" }),
  asyncHandler(oauthCallback)
);

export default router;
