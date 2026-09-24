import express from "express";
import protect from "../../middleware/auth.middleware.js";

import {
  get,
  add,
  update,
  remove,
  clear,
} from "./controller.js";

const router = express.Router();

router.get("/", protect, get);

router.post("/", protect, add);

router.put("/:productId", protect, update);

router.delete("/:productId", protect, remove);

router.delete("/", protect, clear);

export default router;