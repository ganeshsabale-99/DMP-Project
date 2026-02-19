import { Router } from 'express';
import { body } from 'express-validator';
import { analyticsController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get analytics overview
router.get('/overview', analyticsController.getOverview);

// Get time series data
router.get('/time-series', analyticsController.getTimeSeries);

// Get platform breakdown
router.get('/platforms', analyticsController.getPlatformBreakdown);

// Get top performing content
router.get('/top-content', analyticsController.getTopContent);

// Get campaign performance
router.get('/campaigns/:campaignId', analyticsController.getCampaignPerformance);

// Create analytics entry
router.post(
  '/',
  [
    body('date').isISO8601(),
    body('platform').notEmpty(),
    body('metrics').isObject()
  ],
  analyticsController.createAnalytics
);

export default router;
