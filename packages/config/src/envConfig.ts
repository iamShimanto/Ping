import dotenv from "dotenv";
import { bool, cleanEnv, email, port, str, url } from "envalid";
dotenv.config();

export const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),
  MONGODB_URI: str(),
  EMAIL_USER: email(),
  EMAIL_PASS: str(),
  // SMTP host/port are env-configurable so a deploy can reuse an existing
  // mailbox (e.g. the MailFlyo mailbox on mail.byteflyo.shop:587);
  // defaults keep the original Hostinger SMTP behaviour.
  SMTP_HOST: str({ default: "smtp.hostinger.com" }),
  SMTP_PORT: port({ default: 465 }),
  SMTP_SECURE: bool({ default: true }),
  NODE_ENV: str({ choices: ["development", "production"] }),
  JWT_SECRET: str(),
  CLIENT_URL1: url(),
  CLIENT_URL2: url({ default: "" }),
  CLIENT_URL3: url({ default: "" }),
  CLIENT_URL4: url({ default: "" }),
  SERVER_URL: url(),
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
  REDIS_URL: str(),
  VAPID_PUBLIC_KEY: str(),
  VAPID_PRIVATE_KEY: str(),
  VAPID_EMAIL: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  GITHUB_CLIENT_ID: str(),
  GITHUB_CLIENT_SECRET: str(),
});


