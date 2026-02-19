import { Router } from 'express';
import { body } from 'express-validator';
import { aiController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Generate content
router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty(),
    body('platform').optional().isIn(['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN', 'YOUTUBE', 'TIKTOK']),
    body('brandVoice').optional().isIn(['professional', 'casual', 'playful', 'inspirational', 'educational', 'luxury'])
  ],
  aiController.generateContent
);

// Generate image
router.post(
  '/generate-image',
  [
    body('prompt').trim().notEmpty()
  ],
  aiController.generateImage
);

// Analyze content
router.post(
  '/analyze',
  [
    body('content').trim().notEmpty()
  ],
  aiController.analyzeContent
);

// Get best posting times
router.get('/best-times', aiController.getBestPostingTimes);

export default router;
