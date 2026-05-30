import { Router } from 'express';
import { createOrUpdateProfile, getMyProfile } from '../controllers/profile.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('BORROWER', 'ADMIN'));
router.get('/', getMyProfile);
router.post('/', createOrUpdateProfile);
router.put('/', createOrUpdateProfile);

export default router;
