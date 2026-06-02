import mongoose from "mongoose";
import { env } from "./envConfig";

const dbConfig = {
  connect: async () => {
    await mongoose.connect(env.MONGODB_URI);
  },
  disconnect: async () => {
    await mongoose.disconnect();
  }
};



export { dbConfig };

