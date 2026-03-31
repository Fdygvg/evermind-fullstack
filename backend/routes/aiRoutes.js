// backend/routes/aiRoutes.js
import express from 'express';
import { chatWithSage, explainQuestion, rewriteAnswer, saveRewrittenAnswer } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', chatWithSage);
router.post('/explain', explainQuestion);
router.post('/rewrite', rewriteAnswer);
router.put('/save-answer/:questionId', saveRewrittenAnswer);

export default router;
