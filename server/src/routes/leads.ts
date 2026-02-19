import { Router } from 'express';
import { body } from 'express-validator';
import { leadController } from '../controllers';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all leads
router.get('/', leadController.getLeads);

// Get single lead
router.get('/:id', leadController.getLead);

// Create lead
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
  ],
  leadController.createLead
);

// Update lead
router.put('/:id', leadController.updateLead);

// Delete lead
router.delete('/:id', leadController.deleteLead);

// Assign lead
router.post('/:id/assign', leadController.assignLead);

// Update lead status
router.patch('/:id/status', leadController.updateLeadStatus);

// Update lead score
router.patch('/:id/score', leadController.updateLeadScore);

// Add activity
router.post('/:id/activities', leadController.addActivity);

// Bulk import leads
router.post('/bulk-import', leadController.bulkImportLeads);

export default router;
