import { Request, Response, Router } from "express";
import { rateLimit } from "../utils/rateLimit";
import authRoutes from "./auth/auth.routes";
import conversationRoutes from "./conversation/conversation.routes";
import usersRoutes from "./users/users.routes";
const router = Router();


router.use(
  rateLimit({ limit: 1000, windowSec: 15 * 60, keyPrefix: "rl:global" }),
);

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Server is running" });
});

router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/conversations", conversationRoutes);
router.use("/api/v1/users", usersRoutes);

router.use((req: Request, res: Response) => {
  res.status(404).send({ message: "Api enpoint not found" });
});

export default router;
