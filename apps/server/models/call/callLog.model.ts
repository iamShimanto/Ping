import { Schema, model, Types, Document } from "mongoose";

export interface ICallLog extends Document {
  conversationId: Types.ObjectId;
  caller: Types.ObjectId;
  callee: Types.ObjectId;
  callType: "audio" | "video";
  status: "completed" | "missed" | "rejected";
  startedAt: Date;
  endedAt?: Date;
  durationSec: number;
}

const callLogSchema = new Schema<ICallLog>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    caller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    callee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    callType: { type: String, enum: ["audio", "video"], default: "audio" },
    status: { type: String, enum: ["completed", "missed", "rejected"], default: "missed" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSec: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<ICallLog>("CallLog", callLogSchema);
