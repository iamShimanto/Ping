import { RequestHandler } from "express";
import { ApiError, successResponse } from "@repo/helpers";
import BookmarkModel from "../../models/bookmark/bookmark.model";
import MessageModel from "../../models/conversation/message.model";
import ConversationModel from "../../models/conversation/conversation.models";

export const addBookmark: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { messageId } = req.body as { messageId: string };

  if (!messageId) throw new ApiError(400, "messageId is required");

  const message = await MessageModel.findById(messageId).populate("sender", "fullName avatar");
  if (!message) throw new ApiError(404, "Message not found");

  const conv = await ConversationModel.findOne({
    _id: message.conversation,
    participants: userId,
  });
  if (!conv) throw new ApiError(403, "Access denied");

  const existing = await BookmarkModel.findOne({ user: userId, message: messageId });
  if (existing) throw new ApiError(409, "Already bookmarked");

  const bookmark = await BookmarkModel.create({
    user: userId,
    message: messageId,
    conversation: message.conversation,
  });

  successResponse(res, "Bookmarked", 201, { bookmarkId: bookmark._id, messageId });
};

export const removeBookmark: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { messageId } = req.params;

  const deleted = await BookmarkModel.findOneAndDelete({ user: userId, message: messageId });
  if (!deleted) throw new ApiError(404, "Bookmark not found");

  successResponse(res, "Bookmark removed", 200, { messageId });
};

export const getBookmarks: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;

  const bookmarks = await BookmarkModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({
      path: "message",
      populate: { path: "sender", select: "fullName avatar" },
    })
    .populate({
      path: "conversation",
      select: "isGroup groupName participants",
      populate: { path: "participants", select: "fullName avatar" },
    });

  const formatted = bookmarks
    .filter((b) => b.message)
    .map((b) => {
      const msg = b.message as any;
      const conv = b.conversation as any;
      const participants: any[] = conv?.participants ?? [];
      const otherUser = participants.find((p: any) => p._id.toString() !== String(userId));
      const conversationName = conv?.isGroup
        ? (conv.groupName ?? "Group")
        : (otherUser?.fullName ?? "Unknown");

      return {
        bookmarkId: b._id,
        messageId: msg._id,
        conversationId: conv?._id,
        conversationName,
        content: msg.content,
        contentType: msg.contentType,
        fileName: msg.fileName ?? null,
        isDeleted: msg.isDeleted,
        sender: {
          _id: msg.sender?._id,
          fullName: msg.sender?.fullName,
          avatar: msg.sender?.avatar ?? null,
        },
        createdAt: msg.createdAt,
      };
    });

  successResponse(res, "Bookmarks fetched", 200, formatted);
};

export const checkBookmark: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { messageId } = req.params;

  const exists = await BookmarkModel.exists({ user: userId, message: messageId });
  successResponse(res, "Checked", 200, { isBookmarked: !!exists });
};
