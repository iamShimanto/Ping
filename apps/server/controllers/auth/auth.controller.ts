import { RequestHandler } from "express";
import crypto from "crypto";
import { env } from "@repo/config";
import User from "../../models/auth/auth.models";
import { ApiError, successResponse } from "@repo/helpers";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ITokenPayload,
} from "../../utils/tokens";
import { setCache, getCache, delCache } from "../../utils/redisCache";
import { emailQueue } from "../../queues/emailQueue";
import { imageQueue } from "../../queues/imageQueue";

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

export const register: RequestHandler = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const user = await User.create({ fullName, email, password });

  successResponse(res, "User registered successfully", 201, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const payload: ITokenPayload = { userId: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateModifiedOnly: true });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, newRefreshToken);

  successResponse(res, "User logged in successfully", 200, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar ?? null,
  });
};

export const logout: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;
  if (userId) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }
  res.clearCookie("jwt_access");
  res.clearCookie("jwt_refresh");
  successResponse(res, "User logged out successfully", 200, null);
};

export const refreshToken: RequestHandler = async (req, res) => {
  const token = req.cookies?.jwt_refresh;
  if (!token) throw new ApiError(401, "Refresh token missing");

  let payload: ITokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.userId);
  if (!user || user.refreshToken !== token) {
    // Possible token reuse — revoke all sessions
    if (user) await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
    throw new ApiError(401, "Refresh token reuse detected");
  }

  const newPayload: ITokenPayload = { userId: user._id, email: user.email };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateModifiedOnly: true });

  setAccessCookie(res, newAccessToken);
  setRefreshCookie(res, newRefreshToken);

  successResponse(res, "Token refreshed", 200, null);
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  successResponse(res, "User fetched successfully", 200, user);
};

export const changePassword: RequestHandler = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }

  const user = await User.findById((req.user as ITokenPayload)?.userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  successResponse(res, "Password changed successfully", 200, null);
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) {
    return successResponse(res, "If that email exists, a reset link has been sent", 200, null);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await setCache(`pwd_reset:${resetToken}`, String(user._id), 15 * 60);

  const resetUrl = `${env.CLIENT_URL1}/reset-password?token=${resetToken}`;

  await emailQueue.add("forgot-password", {
    to: email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${user.fullName},</p>
      <p>Click the link below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });

  successResponse(res, "If that email exists, a reset link has been sent", 200, null);
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }

  const userId = await getCache<string>(`pwd_reset:${token}`);
  if (!userId) throw new ApiError(400, "Invalid or expired reset token");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.password = newPassword;
  user.refreshToken = undefined; // revoke all sessions after password reset
  await user.save();
  await delCache(`pwd_reset:${token}`);

  successResponse(res, "Password reset successfully", 200, null);
};

export const updateProfile: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const { fullName } = req.body;
  if (fullName) user.fullName = fullName;

  if (req.file) {
    await imageQueue.add("avatar-upload", {
      type: "upload",
      userId: String(userId),
      fileBuffer: req.file.buffer.toString("base64"),
      mimetype: req.file.mimetype,
      folder: "avatars",
      oldPublicId: user.avatarPublicId,
    });
  }

  await user.save({ validateModifiedOnly: true });

  const updated = await User.findById(userId).select("-password -refreshToken");
  successResponse(res, "Profile updated successfully", 200, updated);
};
