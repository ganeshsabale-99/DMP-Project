import { Router } from 'express';
import { body } from 'express-validator';
import { seoController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all SEO pages
router.get('/', seoController.getPages);

// Get keyword suggestions
router.get('/keywords', seoController.getKeywordSuggestions);

// Bulk analyze
router.post('/bulk-analyze', seoController.bulkAnalyze);

// Get single SEO page
router.get('/:id', seoController.getPage);

// Create SEO page
router.post(
  '/',
  [
    body('url').trim().notEmpty(),
    body('title').trim().notEmpty(),
    body('metaDescription').trim().notEmpty()
  ],
  seoController.createPage
);

// Update SEO page
router.put('/:id', seoController.updatePage);

// Delete SEO page
router.delete('/:id', seoController.deletePage);

// Analyze page
router.post('/:id/analyze', seoController.analyzePage);

export default router;
