// routes/questionRoutes.js
import express from 'express';
import { 
  getQuestions, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  bulkImportQuestions,
  searchQuestions,
  exportQuestions
} from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/', getQuestions);
router.get('/search', searchQuestions);
router.get('/export', exportQuestions)
router.post('/', createQuestion);
router.post('/bulk-import', bulkImportQuestions);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;