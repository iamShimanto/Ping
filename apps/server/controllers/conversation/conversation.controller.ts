import { RequestHandler } from "express";
import User from "../../models/auth/auth.models";
import ConversationModel from "../../models/conversation/conversation.models";
import MessageModel from "../../models/conversation/message.model";
import {successResponse} from "@repo/helpers";
import {ApiError} from "@repo/helpers";

export const addNewFriend: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  if (email === req.user?.email) {
    throw new ApiError(400, "You cannot add yourself as a friend");
  }

  const friend = await User.findOne({ email });
  if (!friend) {
    throw new ApiError(404, "User not found");
  }

  const existingParticipant = await ConversationModel.findOne({
    $or: [
      { creator: req.user?.userId, participants: friend._id },
      { creator: friend._id, participants: req.user?.userId }
    ]
  })

  if (existingParticipant) {
    throw new ApiError(400, "You are already friends");
  }

  const conversation = await ConversationModel.create({
    creator: req.user?.userId,
    participants: friend._id,
  });

  successResponse(res, "Friend added successfully", 201, { conversationId: conversation._id, friend: { userId: friend._id, fullName: friend.fullName, email: friend.email } });
}

export const getConversations: RequestHandler = async (req, res) => {
  const conversations = await ConversationModel.find({
    $or: [
      { creator: req.user?.userId },
      { participants: req.user?.userId }
    ]
  }).populate("creator", "fullName email").populate("participants", "fullName email").sort({ updatedAt: -1 });

  const formattedConversations = conversations.map(conv => ({
    conversationId: conv._id,
    friend: conv.creator._id.toString() === req.user?.userId ? conv.participants : conv.creator,
    lastMessage: conv.lastMessage
  }));

  successResponse(res, "Conversations retrieved successfully", 200, formattedConversations);
}

export const sendMessage: RequestHandler = async (req, res) => {
  const { conversationId, contentType = "text", content } = req.body;

  const isExistingConversation = await ConversationModel.findOne({ _id: conversationId });

  if (!isExistingConversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const message = await MessageModel.create({
    contentType,
    content,
    sender: req.user?.userId,
    conversation: conversationId,
  })
  successResponse(res, "Message sent successfully", 201, { messageId: message._id });
}

export const getMessages: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;

  const isExistingConversation = await ConversationModel.findOne({ _id: conversationId });

  if (!isExistingConversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const messages = await MessageModel.find({ conversation: conversationId }).populate("sender", "fullName email").sort({ createdAt: 1 });

  successResponse(res, "Messages retrieved successfully", 200, messages);
}
