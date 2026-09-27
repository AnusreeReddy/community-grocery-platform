import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import {
  create,
  getAll,
  getById,
  join,
  leave,
  update,
  remove,
  dashboard,
  mergeSuggestions,
  analytics,
  bestDeliveryDay,
} from "./controller.js";

const router = express.Router();

// POST routes
router.post("/", protect, create);
router.post("/leave", protect, leave);
router.post("/:id/join", protect, join);

// GET routes (order matters - specific before generic)
router.get("/", getAll);
router.get("/:id/dashboard", protect, dashboard);
router.get("/:id/merge-suggestions", protect, mergeSuggestions);
router.get("/:id/analytics", protect, authorize("communityAdmin", "superAdmin"), analytics);
router.get("/:id/best-delivery-day", protect, authorize("communityAdmin", "superAdmin"), bestDeliveryDay);
router.get("/:id", getById);

// PUT/DELETE routes
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

export default router;
