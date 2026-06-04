import jwt from "jsonwebtoken";
import { env } from "@repo/config";
import { Types } from "mongoose";

export interface ITokenPayload {
  userId: Types.ObjectId;
  email: string;
}

const ACCESS_TOKEN_SECRET = env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = env.JWT_SECRET + "_refresh";

export const signAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as ITokenPayload;
};
