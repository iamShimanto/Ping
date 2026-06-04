import { Queue } from "bullmq";
import { env } from "@repo/config";

export type ImageJobName = "avatar-upload" | "avatar-delete";

export interface ImageUploadJobData {
  type: "upload";
  userId: string;
  fileBuffer: string; // base64
  mimetype: string;
  folder: string;
  oldPublicId?: string;
}

export interface ImageDeleteJobData {
  type: "delete";
  publicId: string;
}

export type ImageJobData = ImageUploadJobData | ImageDeleteJobData;

export const imageQueue = new Queue<ImageJobData, void, ImageJobName>("image", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
