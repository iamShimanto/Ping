import { Worker } from "bullmq";
import { cloudinary, env } from "@repo/config";
import User from "../models/auth/auth.models";
import type { ImageJobData, ImageJobName } from "../queues/imageQueue";

export const imageWorker = new Worker<ImageJobData, void, ImageJobName>(
  "image",
  async (job) => {
    const data = job.data;

    if (data.type === "delete") {
      await cloudinary.uploader.destroy(data.publicId);
      console.log(`[ImageWorker] Deleted ${data.publicId} | job ${job.id}`);
      return;
    }

    // type === "upload"
    const dataUrl = `data:${data.mimetype};base64,${data.fileBuffer}`;

    // Delete old image first if exists
    if (data.oldPublicId) {
      await cloudinary.uploader.destroy(data.oldPublicId);
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: data.folder,
    });

    // Persist new avatar back to user
    await User.findByIdAndUpdate(data.userId, {
      avatar: result.secure_url,
      avatarPublicId: result.public_id,
    });

    console.log(`[ImageWorker] Uploaded avatar for user ${data.userId} | job ${job.id}`);
  },
  { connection: { url: env.REDIS_URL }, concurrency: 3 },
);

imageWorker.on("failed", (job, err) => {
  console.error(`[ImageWorker] Job ${job?.id} failed:`, err.message);
});
