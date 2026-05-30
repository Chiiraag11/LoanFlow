import { Router } from 'express';
import { uploadDocument, getMyDocuments } from '../controllers/document.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticate);
router.post('/upload', authorize('BORROWER'), upload.single('file'), uploadDocument);
router.get('/', authorize('BORROWER', 'ADMIN'), getMyDocuments);

export default router;
