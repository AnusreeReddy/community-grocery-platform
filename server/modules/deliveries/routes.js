import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { create, getAll, getById, updateStatus, approve, inventoryConfirmation, truck, remove } from "./controller.js";

const router = express.Router();

// Delivery detail includes each order's customer name/email for
// fulfilment purposes, so it is restricted to operational roles -- a
// customer should never be able to read another customer's order via this
// endpoint. Customers track their own order status via /orders instead.
router.post("/", protect, authorize("communityAdmin", "superAdmin"), create);
router.get("/", protect, authorize("communityAdmin", "shopkeeper", "superAdmin"), getAll);
router.get("/:id", protect, authorize("communityAdmin", "shopkeeper", "superAdmin"), getById);
router.patch("/:id/status", protect, authorize("communityAdmin", "shopkeeper", "superAdmin"), updateStatus);
router.patch("/:id/approval", protect, authorize("communityAdmin", "superAdmin"), approve);
router.patch("/:id/inventory-confirmation", protect, authorize("shopkeeper", "superAdmin"), inventoryConfirmation);
router.patch("/:id/truck", protect, authorize("communityAdmin", "superAdmin"), truck);
router.delete("/:id", protect, authorize("communityAdmin", "superAdmin"), remove);

export default router;
