import { RequestHandler } from "express";
import User from "../../models/auth/auth.models";
import ConversationModel from "../../models/conversation/conversation.models";
import MessageModel, { IMessage } from "../../models/conversation/message.model";
import { successResponse, ApiError } from "@repo/helpers";
import { getIo } from "../../config/socket";


export const addNewFriend: RequestHandler = async (req, res) => {
  const { email } = req.body as { email: string };

  if (!email?.trim()) throw new ApiError(400, "Email is required");
  if (email.toLowerCase() === req.user?.email?.toLowerCase()) {
    throw new ApiError(400, "You cannot add yourself");
  }

  const friend = await User.findOne({ email: email.toLowerCase() }).select(
    "-password -refreshToken"
  );
  if (!friend) throw new ApiError(404, "User not found");

  const existing = await ConversationModel.findOne({
    isGroup: false,
    participants: { $all: [req.user?.userId, friend._id], $size: 2 },
  });
  if (existing) throw new ApiError(400, "Conversation already exists");

  const conversation = await ConversationModel.create({
    creator: req.user?.userId,
    participants: [req.user?.userId, friend._id],
    isGroup: false,
  });

  successResponse(res, "Friend added successfully", 201, {
    conversationId: conversation._id,
    friend: {
      userId: friend._id,
      fullName: friend.fullName,
      email: friend.email,
      avatar: friend.avatar ?? null,
      status: friend.status,
    },
  });
};

export const createGroup: RequestHandler = async (req, res) => {
  const { groupName, participantIds } = req.body as {
    groupName: string;
    participantIds: string[];
  };

  if (!groupName?.trim()) throw new ApiError(400, "groupName is required");
  if (!Array.isArray(participantIds) || participantIds.length < 2) {
    throw new ApiError(400, "At least 2 participants are required");
  }

  const allParticipants = [
    ...new Set([String(req.user!.userId), ...participantIds]),
  ];

  const conversation = await ConversationModel.create({
    creator: req.user!.userId,
    participants: allParticipants,
    isGroup: true,
    groupName: groupName.trim(),
  });

  const populated = await ConversationModel.findById(conversation._id).populate(
    "participants",
    "fullName email avatar status"
  );

  successResponse(res, "Group created successfully", 201, populated);
};

export const getConversations: RequestHandler = async (req, res) => {
  const userId = String(req.user!.userId);

  const conversations = await ConversationModel.find({
    participants: userId,
  })
    .populate("participants", "fullName email avatar status lastSeen")
    .populate("creator", "fullName email avatar")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  const formatted = conversations.map((conv) => {
    const participants = conv.participants as any[];

    if (conv.isGroup) {
      return {
        conversationId: conv._id,
        isGroup: true,
        groupName: conv.groupName,
        groupAvatar: conv.groupAvatar ?? null,
        participants,
        lastMessage: conv.lastMessage ?? null,
        lastMessageAt: conv.lastMessageAt ?? null,
      };
    }

    const friend = participants.find((p) => p._id.toString() !== userId);
    return {
      conversationId: conv._id,
      isGroup: false,
      friend: friend ?? null,
      lastMessage: conv.lastMessage ?? null,
      lastMessageAt: conv.lastMessageAt ?? null,
    };
  });

  successResponse(res, "Conversations retrieved successfully", 200, formatted);
};

export const getConversation: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const userId = String(req.user!.userId);

  const conv = await ConversationModel.findOne({
    _id: conversationId,
    participants: userId,
  })
    .populate("participants", "fullName email avatar status lastSeen")
    .populate("creator", "fullName email avatar");

  if (!conv) throw new ApiError(404, "Conversation not found");

  successResponse(res, "Conversation retrieved successfully", 200, conv);
};

export const sendMessage: RequestHandler = async (req, res) => {
  const {
    conversationId,
    contentType = "text",
    content,
    fileName,
    fileSize,
  } = req.body as {
    conversationId: string;
    contentType?: IMessage["contentType"];
    content: string;
    fileName?: string;
    fileSize?: number;
  };

  if (!conversationId) throw new ApiError(400, "conversationId is required");
  if (!content?.trim()) throw new ApiError(400, "content is required");

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    participants: req.user!.userId,
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const message = await MessageModel.create({
    contentType,
    content: content.trim(),
    sender: req.user!.userId,
    conversation: conversationId,
    fileName,
    fileSize,
  });

  await ConversationModel.findByIdAndUpdate(conversationId, {
    lastMessage: content.trim(),
    lastMessageAt: new Date(),
  });

  const populated = await message.populate("sender", "fullName email avatar");

  try {
    getIo().to(conversationId).emit("message:received", populated);
  } catch {
    // 
  }

  successResponse(res, "Message sent successfully", 201, populated);
};

export const getMessages: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, parseInt(String(req.query.limit ?? "50"), 10));
  const skip = (page - 1) * limit;

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    participants: req.user!.userId,
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const [messages, total] = await Promise.all([
    MessageModel.find({ conversation: conversationId, isDeleted: false })
      .populate("sender", "fullName email avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    MessageModel.countDocuments({ conversation: conversationId, isDeleted: false }),
  ]);

  successResponse(res, "Messages retrieved successfully", 200, {
    messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

export const deleteMessage: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const userId = String(req.user!.userId);

  const message = await MessageModel.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  message.isDeleted = true;
  message.content = "This message was deleted";
  await message.save();

  try {
    getIo().to(message.conversation.toString()).emit("message:deleted", {
      messageId,
      conversationId: message.conversation,
    });
  } catch {
    //
  }

  successResponse(res, "Message deleted successfully", 200, { messageId });
};

export const markMessageRead: RequestHandler = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user!.userId;

  const message = await MessageModel.findByIdAndUpdate(
    messageId,
    { $addToSet: { readBy: userId } },
    { new: true }
  );
  if (!message) throw new ApiError(404, "Message not found");

  successResponse(res, "Message marked as read", 200, { messageId });
};

export const markAllRead: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user!.userId;

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    participants: userId,
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  await MessageModel.updateMany(
    { conversation: conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  successResponse(res, "All messages marked as read", 200, {});
};

export const searchUsers: RequestHandler = async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) throw new ApiError(400, "Search query is required");

  const users = await User.find({
    _id: { $ne: req.user!.userId },
    $or: [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  })
    .select("fullName email avatar status")
    .limit(20);

  successResponse(res, "Users found", 200, users);
};

export const getUserProfile: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "fullName email avatar status bio location lastSeen"
  );
  if (!user) throw new ApiError(404, "User not found");

  successResponse(res, "User profile retrieved", 200, user);
};
