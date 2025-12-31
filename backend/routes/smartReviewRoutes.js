import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getTodaysQuestions,
    recordRating,
    addMoreQuestions,
    getRolledOverQuestions,
    getReviewStats,
    updatePriorities,
    getQuestionPriority,
    resetQuestionPriority,
    getSectionProgress,
    markUnratedAsPending
} from '../controllers/smartReviewController.js';

const router = express.Router();

// All routes are protected (require authentication)

// Today's questions and session management
router.get('/today', protect, getTodaysQuestions);
router.post('/rate', protect, recordRating);
router.post('/add-more', protect, addMoreQuestions);
router.get('/rolled-over', protect, getRolledOverQuestions);

// Statistics and insights
router.get('/stats', protect, getReviewStats);
router.get('/progress', protect, getSectionProgress);

// Question priority management
router.get('/question/:id', protect, getQuestionPriority);
router.post('/reset/:id', protect, resetQuestionPriority);

// Session management
router.post('/mark-pending', protect, markUnratedAsPending);

// Admin/background tasks (usually called by cron)
router.post('/update-priorities', protect, updatePriorities);

export default router;
