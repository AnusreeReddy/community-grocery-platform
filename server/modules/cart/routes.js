import express from "express";
import protect from "../../middleware/auth.middleware.js";

import { getMine, addItem, updateItem, removeItem, clear } from "./controller.js";

const router = express.Router();

// View the current user's pool cart
router.get("/", protect, getMine);

// Add an item to the pool cart (delivery day/date is chosen later at checkout)
router.post("/", protect, addItem);

// Change the quantity of a pooled item
router.put("/:productId", protect, updateItem);

// Remove a single pooled item
router.delete("/:productId", protect, removeItem);

// Empty the pool cart
router.delete("/", protect, clear);

export default router;
