import { Router } from "express";
import { asyncHandler } from "@repo/helpers";
import { authMiddleWare } from "../../middleware/auth.middleware";
import { getCallLogs } from "../../controllers/call/call.controller";

const router = Router();
router.use(authMiddleWare);

router.get("/", asyncHandler(getCallLogs));

export default router;
