import { model, Schema, Types } from "mongoose";

export interface IMessage {
  contentType: "text" | "image" | "video" | "voice" | "file";
  content: string;
  sender: Types.ObjectId;
  conversation: Types.ObjectId;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  filePublicId?: string;
  isDeleted: boolean;
  readBy: Types.ObjectId[];
  likes: Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>(
  {
    contentType: {
      type: String,
      enum: ["text", "image", "video", "voice", "file"],
      required: true,
    },
    content: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    filePublicId: { type: String },
    isDeleted: { type: Boolean, default: false },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const MessageModel = model<IMessage>("Message", messageSchema);

export default MessageModel;
