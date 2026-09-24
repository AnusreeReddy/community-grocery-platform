import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";

import {
  create,
  getMine,
  getById,
  updateStatus,
  cancel,
} from "./controller.js";

const router = express.Router();

// Place Order
router.post("/", protect, create);

// My Orders
router.get("/my-orders", protect, getMine);

// Single Order
router.get("/:id", protect, getById);

// Manual status override. The normal lifecycle is driven by delivery
// approval/status updates (see deliveries module); this is a superAdmin-only
// escape hatch and still enforces valid state transitions.
router.patch("/:id/status", protect, authorize("superAdmin"), updateStatus);

// Cancel Order
router.patch("/:id/cancel", protect, cancel);

export default router;