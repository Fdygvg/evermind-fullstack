// routes/userRoutes.js
import express from "express";
import {
  updatePreferences,
  getPreferences,
  updateProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected (require authentication)
router.post("/preferences", protect, updatePreferences);
router.get("/preferences", protect, getPreferences);
router.put("/profile", protect, updateProfile);

export default router;

