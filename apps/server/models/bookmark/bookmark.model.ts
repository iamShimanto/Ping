import { model, Schema, Types } from "mongoose";

export interface IBookmark {
  user: Types.ObjectId;
  message: Types.ObjectId;
  conversation: Types.ObjectId;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, message: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const BookmarkModel = model<IBookmark>("Bookmark", bookmarkSchema);
export default BookmarkModel;
