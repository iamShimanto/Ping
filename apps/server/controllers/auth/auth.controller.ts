import { RequestHandler } from "express";
import { env } from "@repo/config";
import User from "../../models/auth/auth.models";
import { ApiError } from "@repo/helpers";
import { signAccessToken } from "../../utils/tokens";
import { successResponse } from "@repo/helpers";

export const register: RequestHandler = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const isExistingUser = await User.findOne({ email });
  if (isExistingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({ fullName, email, password });
  successResponse(res, "User registered successfully", 201, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signAccessToken({ userId: user._id, email: user.email });
  res.cookie("jwt_access", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  successResponse(res, "User logged in successfully", 200, {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
  });
};

export const logout: RequestHandler = async (req, res) => {
  res.clearCookie("jwt_access");
  successResponse(res, "User logged out successfully", 200, null);
};
