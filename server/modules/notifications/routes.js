import express from "express";
import protect from "../../middleware/auth.middleware.js";
import { getNotifications, readNotification } from "./controller.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, readNotification);

export default router;
