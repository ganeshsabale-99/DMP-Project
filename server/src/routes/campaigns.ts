import { Router } from 'express';
import { body } from 'express-validator';
import { campaignController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all campaigns
router.get('/', campaignController.getCampaigns);

// Get single campaign
router.get('/:id', campaignController.getCampaign);

// Create campaign
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['EMAIL', 'SOCIAL', 'ADS', 'SEO', 'CONTENT']),
    body('startDate').isISO8601()
  ],
  campaignController.createCampaign
);

// Update campaign
router.put('/:id', campaignController.updateCampaign);

// Delete campaign
router.delete('/:id', campaignController.deleteCampaign);

// Add post to campaign
router.post('/:id/posts', campaignController.addPostToCampaign);

// Add lead to campaign
router.post('/:id/leads', campaignController.addLeadToCampaign);

// Update campaign status
router.patch('/:id/status', campaignController.updateCampaignStatus);

// Update campaign metrics
router.patch('/:id/metrics', campaignController.updateCampaignMetrics);

export default router;
