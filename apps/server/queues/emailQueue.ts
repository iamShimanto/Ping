import { Queue } from "bullmq";
import { env } from "@repo/config";

export type EmailJobName = "forgot-password" | "welcome";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export const emailQueue = new Queue<EmailJobData, void, EmailJobName>("email", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
