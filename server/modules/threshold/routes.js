import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import { evaluate, mergeSuggestions } from "./controller.js";

const router = express.Router();

router.post("/run", protect, authorize("superAdmin", "communityAdmin"), evaluate);
router.get("/:id/merge-suggestions", protect, mergeSuggestions);

export default router;
