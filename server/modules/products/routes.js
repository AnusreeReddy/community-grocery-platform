import express from "express";
import protect from "../../middleware/auth.middleware.js";
import authorize from "../../middleware/role.middleware.js";
import {
  create,
  getAll,
  getById,
  update,
  remove,
  search,
  filter,
} from "./controller.js";

const router = express.Router();

router.post("/", protect, authorize("shopkeeper", "superAdmin"), create);
router.get("/", getAll);
router.get("/search", search);
router.get("/category/:category", filter);
router.get("/:id", getById);
router.put("/:id", protect, authorize("shopkeeper", "superAdmin"), update);
router.delete("/:id", protect, authorize("shopkeeper", "superAdmin"), remove);

export default router;
