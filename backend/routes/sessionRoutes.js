// routes/sessionRoutes.js
import express from 'express';
import {
  startSession,
  getCurrentSession,
  getNextQuestion,
  submitAnswer,
  endSession,
  getLastSessionResults,
  updateProgress,
  pauseSession,
  getSimplifiedSessions,
  resumeSimplifiedSession,
  endSimplifiedSession
} from '../controllers/sessionController.js';
import { protect, writeLimiter, commonLimiter } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.post('/start', writeLimiter, startSession);
router.get('/current', commonLimiter, getCurrentSession);
router.get('/next-question', commonLimiter, getNextQuestion);
router.post('/answer', writeLimiter, submitAnswer);
router.delete('/current', writeLimiter, endSession);
router.get('/last-results', commonLimiter, getLastSessionResults);
router.post('/update-progress', writeLimiter, updateProgress);
router.post('/pause', writeLimiter, pauseSession);

// Simplified (Quick Play) session routes
router.get('/simplified', commonLimiter, getSimplifiedSessions);
router.post('/simplified/:sessionId/resume', writeLimiter, resumeSimplifiedSession);
router.delete('/simplified/:sessionId', writeLimiter, endSimplifiedSession);

export default router;