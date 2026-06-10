import { Request, Response } from "express";
import PushSubscription from "../../models/push/pushSubscription.model";

export const subscribePush = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ message: "Invalid subscription payload" });
    return;
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { userId, endpoint, keys },
    { upsert: true, new: true }
  );

  res.status(201).json({ message: "Subscribed" });
};

export const unsubscribePush = async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await PushSubscription.deleteOne({ endpoint });
  }
  res.json({ message: "Unsubscribed" });
};
