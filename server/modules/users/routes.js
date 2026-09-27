import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import {
  getAll,
  getProfile,
  getById,
  updateProfile,
  changeRole,
  remove,
} from "./controller.js";

const router = express.Router();

router.get("/", protect, authorize("superAdmin"), getAll);
router.get("/me", protect, getProfile);
router.get("/:id", protect, authorize("superAdmin"), getById);
router.put("/me", protect, updateProfile);
router.patch("/:id/role", protect, authorize("superAdmin"), changeRole);
router.delete("/:id", protect, authorize("superAdmin"), remove);

export default router;
