import webpush from "web-push";
import { env } from "@repo/config";
import PushSubscription from "../models/push/pushSubscription.model";

webpush.setVapidDetails(
  env.VAPID_EMAIL,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          message
        );
      } catch (err: any) {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );
};
