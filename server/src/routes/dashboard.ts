import { Router } from 'express';
import { dashboardController } from '../controllers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CEO Dashboard
router.get('/ceo', authorize('SUPER_ADMIN'), dashboardController.getCEODashboard);

// Marketing Dashboard
router.get('/marketing', authorize('SUPER_ADMIN', 'MARKETING_HEAD', 'DM_EXECUTIVE'), dashboardController.getMarketingDashboard);

// Lead Dashboard
router.get('/leads', authorize('SUPER_ADMIN', 'MARKETING_HEAD', 'SALES_TEAM'), dashboardController.getLeadDashboard);

// Analytics Dashboard
router.get('/analytics', authorize('SUPER_ADMIN', 'MARKETING_HEAD', 'ANALYST'), dashboardController.getAnalyticsDashboard);

export default router;
