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
  pauseSession
} from '../controllers/sessionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.post('/start', startSession);
router.get('/current', getCurrentSession);
router.get('/next-question', getNextQuestion);
router.post('/answer', submitAnswer);
router.delete('/current', endSession);
router.get('/last-results', getLastSessionResults);
router.post('/update-progress', updateProgress);
router.post('/pause', pauseSession);

export default router;