import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { redis } from "@repo/config";
import { rateLimit } from "../utils/rateLimit";
import authRoutes from "./auth/auth.routes";
import conversationRoutes from "./conversation/conversation.routes";
import usersRoutes from "./users/users.routes";
import bookmarkRoutes from "./bookmark/bookmark.routes";
import callRoutes from "./call/call.routes";
import pushRoutes from "./push/push.routes";
const router = Router();

// Health / readiness probe (no auth, before the rate limiter so monitors
// are never 429'd). 200 when mongo + redis are up, 503 otherwise.
router.get("/health", async (req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  let redisState = "disconnected";
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("redis ping timeout")), 2000),
      ),
    ]);
    redisState = pong === "PONG" ? "connected" : "disconnected";
  } catch {
    redisState = "disconnected";
  }

  const ok = mongoState === "connected" && redisState === "connected";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    mongo: mongoState,
    redis: redisState,
    uptimeSec: Math.round(process.uptime()),
  });
});

router.use(
  rateLimit({ limit: 1000, windowSec: 15 * 60, keyPrefix: "rl:global" }),
);

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/conversations", conversationRoutes);
router.use("/api/v1/users", usersRoutes);
router.use("/api/v1/bookmarks", bookmarkRoutes);
router.use("/api/v1/calls", callRoutes);
router.use("/api/v1/push", pushRoutes);

router.use((req: Request, res: Response) => {
  res.status(404).send({ message: "Api enpoint not found" });
});

export default router;
