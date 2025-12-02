// routes/statsRoutes.js
import express from 'express';
import { 
  getUserStats,
  getSessionHistory,
  getDetailedAnalytics 
} from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/', getUserStats);
router.get('/analytics', getDetailedAnalytics);
router.get('/sessions', getSessionHistory);


export default router;