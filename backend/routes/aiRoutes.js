// backend/routes/aiRoutes.js
import express from 'express';
import { explainQuestion, rewriteAnswer, saveRewrittenAnswer } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/explain', explainQuestion);
router.post('/rewrite', rewriteAnswer);
router.put('/save-answer/:questionId', saveRewrittenAnswer);

export default router;
