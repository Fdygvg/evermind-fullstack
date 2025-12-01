// routes/sectionRoutes.js
import express from 'express';
import { 
  getSections, 
  createSection, 
  updateSection, 
  deleteSection,
  getSectionStats 
} from '../controllers/sectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/', getSections);
router.post('/', createSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);
router.get('/:sectionId/stats', getSectionStats);
export default router;