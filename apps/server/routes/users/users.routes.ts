import { Router } from "express";
import * as conv from "../../controllers/conversation/conversation.controller";
import { asyncHandler } from "@repo/helpers";
import { authMiddleWare } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleWare);

router.get("/search", asyncHandler(conv.searchUsers));
router.get("/:userId", asyncHandler(conv.getUserProfile));

export default router;
