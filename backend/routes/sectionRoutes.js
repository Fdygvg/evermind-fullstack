// routes/sectionRoutes.js
import express from 'express';
import { 
  getSections, 
  createSection, 
  updateSection, 
  deleteSection,
  getSectionStats,
  archiveSection,
  restoreSection,
  resetAllProgress
} from '../controllers/sectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected

router.get('/', getSections);
router.post('/', createSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);
router.get('/:sectionId/stats', getSectionStats);
router.patch('/:id/archive', archiveSection);
router.patch('/:id/restore', restoreSection);
router.post('/reset-progress', resetAllProgress);
export default router;