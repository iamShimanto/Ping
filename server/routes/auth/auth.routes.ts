import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller";
import { asyncHandler } from "../../utils/asyncHandler";
import { rateLimit } from "../../utils/rateLimit";
const router = Router();

router.post("/register", rateLimit({ limit: 10, windowSec: 5 * 60, keyPrefix: "rl:register" }), asyncHandler(authController.register));
router.post("/login", rateLimit({ limit: 10, windowSec: 5 * 60, keyPrefix: "rl:login" }), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));

export default router;
