import { Router } from "express";
import * as conv from "../../controllers/conversation/conversation.controller";
import { asyncHandler } from "@repo/helpers";
import { authMiddleWare } from "../../middleware/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// All conversation routes require authentication
router.use(authMiddleWare);

// ── Conversations
router.post("/add-new-friend", asyncHandler(conv.addNewFriend));
router.post("/create-group", asyncHandler(conv.createGroup));
router.get("/list", asyncHandler(conv.getConversations));
router.get("/:conversationId", asyncHandler(conv.getConversation));

// ── Messages 
router.post("/messages/send", upload.single("file"), asyncHandler(conv.sendMessage));
router.get("/messages/:conversationId", asyncHandler(conv.getMessages));
router.get("/messages/:conversationId/search", asyncHandler(conv.searchMessages));
router.delete("/messages/:messageId", asyncHandler(conv.deleteMessage));
router.patch("/messages/:messageId/read", asyncHandler(conv.markMessageRead));
router.patch("/messages/:messageId/like", asyncHandler(conv.likeMessage));
router.patch("/messages/:messageId/react", asyncHandler(conv.reactToMessage));
router.patch(
  "/messages/read-all/:conversationId",
  asyncHandler(conv.markAllRead),
);

export default router;
