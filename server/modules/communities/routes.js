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
} from "./controller.js";

const router = express.Router();

router.post("/", protect, create);
router.get("/", getAll);
router.post("/:id/join", protect, join);
router.post("/leave", protect, leave);
router.get("/:id/dashboard", protect, dashboard);
router.get("/:id/merge-suggestions", protect, mergeSuggestions);
router.get("/:id", getById);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

export default router;
