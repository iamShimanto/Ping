import { RequestHandler } from "express";
import CallLog from "../../models/call/callLog.model";
import { successResponse } from "@repo/helpers";

export const getCallLogs: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;

  const logs = await CallLog.find({
    $or: [{ caller: userId }, { callee: userId }],
  })
    .populate("caller", "fullName avatar")
    .populate("callee", "fullName avatar")
    .sort({ createdAt: -1 })
    .limit(50);

  successResponse(res, "Call logs retrieved", 200, logs);
};
