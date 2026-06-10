import { Schema, model, Types } from "mongoose";

interface PushSubscriptionDoc {
  userId: Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const pushSubscriptionSchema = new Schema<PushSubscriptionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1 });

export default model<PushSubscriptionDoc>("PushSubscription", pushSubscriptionSchema);
