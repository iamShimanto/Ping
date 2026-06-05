import { model, Schema, Types } from "mongoose";

export interface IConversation {
  creator: Types.ObjectId;
  participants: Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupAvatarPublicId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export const conversationSchema = new Schema<IConversation>(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    groupAvatarPublicId: { type: String },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Index for fast participant lookups
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const ConversationModel = model<IConversation>("Conversation", conversationSchema);

export default ConversationModel;
