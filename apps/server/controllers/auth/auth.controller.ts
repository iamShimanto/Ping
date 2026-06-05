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

// ─── Cookie helpers

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
  const { fullName, email, password } = req.body as {
    fullName: string;
    email: string;
    password: string;
  };

  if (!fullName?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, "fullName, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email is already registered");

  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase(),
    password,
  });

  await emailQueue.add("welcome", {
    to: user.email,
    subject: "Welcome to Doot Chat!",
    html: `<h2>Hi ${user.fullName}, welcome to Doot Chat!</h2><p>Your account has been created successfully.</p>`,
  });

  successResponse(res, "Registered successfully", 201, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar ?? null,
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const payload: ITokenPayload = { userId: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  user.status = "online";
  await user.save({ validateModifiedOnly: true });

  setAccessCookie(res, accessToken);
  setRefreshCookie(res, newRefreshToken);

  successResponse(res, "Logged in successfully", 200, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar ?? null,
    status: user.status,
    bio: user.bio ?? null,
    location: user.location ?? null,
  });
};

export const logout: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
      status: "offline",
      lastSeen: new Date(),
    });
  }

  res.clearCookie("jwt_access");
  res.clearCookie("jwt_refresh");
  successResponse(res, "Logged out successfully", 200, null);
};

export const refreshToken: RequestHandler = async (req, res) => {
  const token = req.cookies?.jwt_refresh as string | undefined;
  if (!token) throw new ApiError(401, "Refresh token missing");

  let payload: ITokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.userId);

  if (!user || user.refreshToken !== token) {
    if (user) {
      await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie("jwt_access");
    res.clearCookie("jwt_refresh");
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

  successResponse(res, "User fetched successfully", 200, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar ?? null,
    status: user.status,
    bio: user.bio ?? null,
    location: user.location ?? null,
    lastSeen: user.lastSeen ?? null,
  });
};

export const changePassword: RequestHandler = async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById((req.user as ITokenPayload)?.userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, "Current password is incorrect");

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();

  res.clearCookie("jwt_access");
  res.clearCookie("jwt_refresh");
  successResponse(res, "Password changed successfully. Please log in again.", 200, null);
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) throw new ApiError(400, "Email is required");

  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return successResponse(res, "If that email exists, a reset link has been sent", 200, null);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await setCache(`pwd_reset:${resetToken}`, String(user._id), 15 * 60);

  const resetUrl = `${env.CLIENT_URL1}/reset-password?token=${resetToken}`;

  await emailQueue.add("forgot-password", {
    to: email,
    subject: "Password Reset Request — Doot Chat",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7269ef">Password Reset</h2>
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#7269ef;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="color:#888;font-size:12px;margin-top:24px">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  successResponse(res, "If that email exists, a reset link has been sent", 200, null);
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { token, newPassword } = req.body as {
    token: string;
    newPassword: string;
  };

  if (!token || !newPassword) {
    throw new ApiError(400, "token and newPassword are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const userId = await getCache<string>(`pwd_reset:${token}`);
  if (!userId) throw new ApiError(400, "Invalid or expired reset token");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();
  await delCache(`pwd_reset:${token}`);

  successResponse(res, "Password reset successfully. Please log in.", 200, null);
};

export const updateProfile: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const { fullName, bio, location } = req.body as {
    fullName?: string;
    bio?: string;
    location?: string;
  };

  if (fullName?.trim()) user.fullName = fullName.trim();
  if (bio !== undefined) user.bio = bio.trim() || undefined;
  if (location !== undefined) user.location = location.trim() || undefined;

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
  successResponse(res, "Profile updated successfully", 200, {
    userId: updated!._id,
    fullName: updated!.fullName,
    email: updated!.email,
    avatar: updated!.avatar ?? null,
    status: updated!.status,
    bio: updated!.bio ?? null,
    location: updated!.location ?? null,
  });
};

export const updateStatus: RequestHandler = async (req, res) => {
  const userId = (req.user as ITokenPayload)?.userId;
  const { status } = req.body as {
    status: "online" | "offline" | "away" | "busy";
  };

  const allowed = ["online", "offline", "away", "busy"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { status, ...(status === "offline" ? { lastSeen: new Date() } : {}) },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  successResponse(res, "Status updated", 200, { status: user.status });
};
