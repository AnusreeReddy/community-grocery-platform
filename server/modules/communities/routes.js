import express from "express";
import { create } from "./controller.js";

const router = express.Router();

import protect from "../../middleware/auth.middleware.js";

router.post("/", protect, create);

export default router;