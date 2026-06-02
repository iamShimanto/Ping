import jwt from "jsonwebtoken";
import { env } from "@repo/config";
import { Types } from "mongoose";

export interface ITokenPayload {
  userId: Types.ObjectId;
  email: string;
}

export const signAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}
