import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import {
  getAll,
  getProfile,
  getById,
  updateProfile,
  changeRole,
  approveShopkeeper,
  remove,
} from "./controller.js";

const router = express.Router();

// superAdmin and communityAdmin both need to see the user list (e.g. pending
// shopkeeper approvals, community membership); only superAdmin can mutate.
router.get("/", protect, authorize("superAdmin", "communityAdmin"), getAll);
router.get("/me", protect, getProfile);
router.get("/:id", protect, authorize("superAdmin"), getById);
router.put("/me", protect, updateProfile);
router.patch("/:id/role", protect, authorize("superAdmin"), changeRole);
router.patch("/:id/shopkeeper-approval", protect, authorize("superAdmin"), approveShopkeeper);
router.delete("/:id", protect, authorize("superAdmin"), remove);

export default router;
