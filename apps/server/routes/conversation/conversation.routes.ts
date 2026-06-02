import { Router } from "express";
import * as conversation from "../../controllers/conversation/conversation.controller";
import {asyncHandler} from "@repo/helpers";
const router = Router();

router.post("/add-new-friend", asyncHandler(conversation.addNewFriend));
router.get("/list", asyncHandler(conversation.getConversations));
router.post("/send-message", asyncHandler(conversation.sendMessage));
router.get("/messages/:conversationId", asyncHandler(conversation.getMessages));


export default router;
