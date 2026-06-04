import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller";
import { asyncHandler } from "@repo/helpers";
import { rateLimit } from "../../utils/rateLimit";
import { authMiddleWare } from "../../middleware/auth.middleware";
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

export default router;
