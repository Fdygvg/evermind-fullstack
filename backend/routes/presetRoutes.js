import express from "express";
import {
  getRecommendedPresets,
  importPreset,
  getCategoryPresets,
  autoImportPresets,
} from "../controllers/presetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All routes protected

router.get("/recommended", getRecommendedPresets);
router.post("/import/:presetId", importPreset);
router.post("/auto-import", autoImportPresets);
router.get("/:category", getCategoryPresets);
export default router;
