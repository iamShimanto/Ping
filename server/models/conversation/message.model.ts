import { model, Schema, Types } from "mongoose";

export interface IMessage {
  contentType: "text" | "image" | "video" | "voice" | "file";
  content: string;
  sender: Types.ObjectId;
  conversation: Types.ObjectId;
}

const messageSchema = new Schema({
  contentType: {
    type: String,
    enum: ["text", "image", "video", "voice", "file"],
    required: true,
  },
  content: { type: String, required: true },
  sender: { type: Types.ObjectId, ref: "User", required: true },
  conversation: { type: Types.ObjectId, ref: "Conversation", required: true },
}, { timestamps: true });

const MessageModel = model<IMessage>("Message", messageSchema);

export default MessageModel;
