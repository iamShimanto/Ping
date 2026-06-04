import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { env } from "@repo/config";
import type { EmailJobData, EmailJobName } from "../queues/emailQueue";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export const emailWorker = new Worker<EmailJobData, void, EmailJobName>(
  "email",
  async (job) => {
    const { to, subject, html } = job.data;
    await transporter.sendMail({
      from: `"Chat App" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EmailWorker] Mail sent to ${to} | job ${job.id}`);
  },
  { connection: { url: env.REDIS_URL }, concurrency: 5 },
);

emailWorker.on("failed", (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});
