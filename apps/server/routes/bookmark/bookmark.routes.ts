import { Router } from "express";
import * as bookmark from "../../controllers/bookmark/bookmark.controller";
import { asyncHandler } from "@repo/helpers";
import { authMiddleWare } from "../../middleware/auth.middleware";

const router = Router();
router.use(authMiddleWare);

router.get("/", asyncHandler(bookmark.getBookmarks));
router.post("/", asyncHandler(bookmark.addBookmark));
router.delete("/:messageId", asyncHandler(bookmark.removeBookmark));
router.get("/check/:messageId", asyncHandler(bookmark.checkBookmark));

export default router;
