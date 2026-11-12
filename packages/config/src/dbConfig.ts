import mongoose from "mongoose";
import { env } from "./envConfig";

const dbConfig = {
  connect: async () => {
    // Fail fast on dead/unreachable MongoDB instead of hanging on the
    // 30 s default server-selection timeout.
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  },
  disconnect: async () => {
    await mongoose.disconnect();
  }
};

export { dbConfig };

