import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { create, getAll, getById, updateStatus, remove } from "./controller.js";

const router = express.Router();

router.post("/", protect, authorize("communityAdmin", "superAdmin"), create);
router.get("/", protect, authorize("communityAdmin", "shopkeeper", "superAdmin"), getAll);
router.get("/:id", protect, getById);
router.patch("/:id/status", protect, authorize("communityAdmin", "shopkeeper", "superAdmin"), updateStatus);
router.delete("/:id", protect, authorize("communityAdmin", "superAdmin"), remove);

export default router;
