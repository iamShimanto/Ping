import { RequestHandler } from "express";
import { env } from "@repo/config";
import { IUser } from "../../models/auth/auth.models";
import User from "../../models/auth/auth.models";
import { signAccessToken, signRefreshToken, ITokenPayload } from "../../utils/tokens";

function setAccessCookie(res: any, token: string) {
  res.cookie("jwt_access", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
}

function setRefreshCookie(res: any, token: string) {
  res.cookie("jwt_refresh", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const oauthCallback: RequestHandler = async (req, res) => {
  const user = req.user as (IUser & { _id: any }) | undefined;

  if (!user) {
    return res.redirect(`${env.CLIENT_URL1}/login?error=oauth_failed`);
  }

  const payload: ITokenPayload = { userId: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  await User.findByIdAndUpdate(user._id, {
    refreshToken: newRefreshToken,
    status: "online",
  });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, newRefreshToken);

  res.redirect(`${env.CLIENT_URL1}/oauth/callback`);
};
