import { Router } from 'express';
import { getSalesLeads, getAdminStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/leads', authorize('SALES', 'ADMIN'), getSalesLeads);
router.get('/stats', authorize('ADMIN'), getAdminStats);

export default router;
