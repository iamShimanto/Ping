import { model, Schema, Types } from "mongoose";

export interface IConversation {
  creator: Types.ObjectId;
  participants: Types.ObjectId;
  lastMessage?: string;
}

export const conversationSchema = new Schema({
  creator: { type: Types.ObjectId, ref: "User", required: true },
  participants: { type: Types.ObjectId, ref: "User", required: true },
  lastMessage: { type: String },
}, { timestamps: true });

const ConversationModel = model<IConversation>("Conversation", conversationSchema);

export default ConversationModel;
