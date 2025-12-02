// routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
// Public routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Protected routes (require authentication)
router.get("/auth/profile", protect, getProfile);
router.post("/auth/logout", protect, logout);
router.post('/auth/resend-verification', protect, resendVerification);


export default router;
