import { Router } from 'express';
import {
  applyLoan, getMyLoans, getLoanById,
  getAppliedLoans, sanctionLoan,
  getSanctionedLoans, disburseLoan,
  getActiveLoans, recordPayment,
} from '../controllers/loan.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Borrower
router.post('/apply', authorize('BORROWER'), applyLoan);
router.get('/my', authorize('BORROWER'), getMyLoans);

// Sanction
router.get('/applied', authorize('SANCTION', 'ADMIN'), getAppliedLoans);
router.put('/:id/sanction', authorize('SANCTION', 'ADMIN'), sanctionLoan);

// Disbursement
router.get('/sanctioned', authorize('DISBURSEMENT', 'ADMIN'), getSanctionedLoans);
router.put('/:id/disburse', authorize('DISBURSEMENT', 'ADMIN'), disburseLoan);

// Collection
router.get('/active', authorize('COLLECTION', 'ADMIN'), getActiveLoans);
router.post('/:id/payment', authorize('COLLECTION', 'ADMIN'), recordPayment);

// Universal get by id
router.get('/:id', authorize('BORROWER', 'ADMIN', 'SANCTION', 'DISBURSEMENT', 'COLLECTION'), getLoanById);

export default router;
