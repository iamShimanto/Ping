import { Router } from "express";
import { subscribePush, unsubscribePush } from "../../controllers/push/push.controller";
import { authMiddleWare } from "../../middleware/auth.middleware";

const router = Router();

router.post("/subscribe", authMiddleWare, subscribePush);
router.post("/unsubscribe", authMiddleWare, unsubscribePush);

export default router;
