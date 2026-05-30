import { Request, Response } from 'express';
import LoanApplication from '../models/LoanApplication';
import LoanStatusHistory from '../models/LoanStatusHistory';
import BorrowerProfile from '../models/BorrowerProfile';
import Payment from '../models/Payment';
import DocumentModel from '../models/Document';
import { calculateLoan } from '../services/bre.service';
import { validateTransition } from '../services/stateMachine.service';
import { LoanStatus } from '../types';

export const applyLoan = async (req: Request, res: Response) => {
  try {
    const { loanAmount, tenure, documentId } = req.body;
    const userId = req.user!.userId;

    const profile = await BorrowerProfile.findOne({ userId });
    if (!profile) return res.status(400).json({ message: 'Please complete your profile first' });

    const existing = await LoanApplication.findOne({
      borrowerId: userId,
      status: { $in: ['APPLIED', 'SANCTIONED', 'DISBURSED'] },
    });
    if (existing) return res.status(409).json({ message: 'You already have an active loan application' });

    const amount = Number(loanAmount);
    const days   = Number(tenure);
    if (amount < 50000 || amount > 500000)
      return res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
    if (days < 30 || days > 365)
      return res.status(400).json({ message: 'Tenure must be between 30 and 365 days' });

    const { simpleInterest, totalRepayment, interestRate } = calculateLoan(amount, days);

    const loan = await LoanApplication.create({
      borrowerId: userId,
      profileId: profile._id,
      loanAmount: amount,
      tenure: days,
      interestRate,
      simpleInterest,
      totalRepayment,
      outstandingBalance: totalRepayment,
      amountPaid: 0,
      status: 'APPLIED',
      documentId: documentId || undefined,
    });

    await LoanStatusHistory.create({ loanApplicationId: loan._id, toStatus: 'APPLIED', changedBy: userId });

    // Back-fill Document.loanApplicationId
    if (documentId) {
      await DocumentModel.findByIdAndUpdate(documentId, { loanApplicationId: loan._id });
    }

    res.status(201).json({ message: 'Loan application submitted successfully', loan });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyLoans = async (req: Request, res: Response) => {
  try {
    const loans = await LoanApplication.find({ borrowerId: req.user!.userId })
      .populate('profileId')
      .sort({ createdAt: -1 });
    res.json({ loans });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getLoanById = async (req: Request, res: Response) => {
  try {
    const loan = await LoanApplication.findById(req.params.id)
      .populate('borrowerId', 'name email')
      .populate('profileId')
      .populate('sanctionedBy', 'name')
      .populate('disbursedBy', 'name');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (req.user!.role === 'BORROWER' && loan.borrowerId.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const history = await LoanStatusHistory.find({ loanApplicationId: loan._id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: 1 });

    const payments = await Payment.find({ loanApplicationId: loan._id }).sort({ createdAt: -1 });

    res.json({ loan, history, payments });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// OPS: Sanction module — view APPLIED loans
export const getAppliedLoans = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query: any = { status: 'APPLIED' };
    const loans = await LoanApplication.find(query)
      .populate('borrowerId', 'name email')
      .populate('profileId')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await LoanApplication.countDocuments(query);
    res.json({ loans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const sanctionLoan = async (req: Request, res: Response) => {
  try {
    const { action, rejectionReason } = req.body;
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const newStatus: LoanStatus = action === 'approve' ? 'SANCTIONED' : 'REJECTED';
    validateTransition(loan.status, newStatus);

    if (newStatus === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const fromStatus = loan.status;
    loan.status = newStatus;
    loan.sanctionedBy = req.user!.userId as any;
    loan.sanctionedAt = new Date();
    if (rejectionReason) loan.rejectionReason = rejectionReason;
    await loan.save();

    await LoanStatusHistory.create({
      loanApplicationId: loan._id,
      fromStatus,
      toStatus: newStatus,
      changedBy: req.user!.userId,
      reason: rejectionReason,
    });

    res.json({ message: `Loan ${action === 'approve' ? 'sanctioned' : 'rejected'} successfully`, loan });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// OPS: Disbursement module — view SANCTIONED loans
export const getSanctionedLoans = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const loans = await LoanApplication.find({ status: 'SANCTIONED' })
      .populate('borrowerId', 'name email')
      .populate('profileId')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await LoanApplication.countDocuments({ status: 'SANCTIONED' });
    res.json({ loans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const disburseLoan = async (req: Request, res: Response) => {
  try {
    const { disbursementExecutive } = req.body;
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    validateTransition(loan.status, 'DISBURSED');

    const fromStatus = loan.status;
    loan.status = 'DISBURSED';
    loan.disbursedBy = req.user!.userId as any;
    loan.disbursedAt = new Date();
    loan.disbursementExecutive = disbursementExecutive || '';
    await loan.save();

    await LoanStatusHistory.create({
      loanApplicationId: loan._id,
      fromStatus,
      toStatus: 'DISBURSED',
      changedBy: req.user!.userId,
    });

    res.json({ message: 'Loan disbursed successfully', loan });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// OPS: Collection module — view DISBURSED loans
export const getActiveLoans = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const loans = await LoanApplication.find({ status: 'DISBURSED' })
      .populate('borrowerId', 'name email')
      .populate('profileId')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await LoanApplication.countDocuments({ status: 'DISBURSED' });
    res.json({ loans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { utrNumber, amount, paymentDate } = req.body;
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.status !== 'DISBURSED') {
      return res.status(400).json({ message: 'Can only record payments for DISBURSED loans' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) return res.status(400).json({ message: 'Payment amount must be positive' });
    if (payAmount > loan.outstandingBalance) {
      return res.status(400).json({
        message: `Payment ₹${payAmount} exceeds outstanding balance ₹${loan.outstandingBalance}`,
      });
    }

    const utrExists = await Payment.findOne({ utrNumber: utrNumber.toUpperCase() });
    if (utrExists) return res.status(409).json({ message: 'UTR number already exists. Each UTR must be globally unique.' });

    const payment = await Payment.create({
      loanApplicationId: loan._id,
      borrowerId: loan.borrowerId,
      collectedBy: req.user!.userId,
      utrNumber: utrNumber.toUpperCase(),
      amount: payAmount,
      paymentDate: new Date(paymentDate),
    });

    loan.amountPaid += payAmount;
    loan.outstandingBalance = Math.max(0, loan.totalRepayment - loan.amountPaid);

    // Auto-close when fully repaid (DISBURSED → CLOSED per PDF)
    if (loan.amountPaid >= loan.totalRepayment) {
      const fromStatus = loan.status;
      loan.status = 'CLOSED';
      loan.closedAt = new Date();
      await LoanStatusHistory.create({
        loanApplicationId: loan._id,
        fromStatus,
        toStatus: 'CLOSED',
        changedBy: req.user!.userId,
      });
    }

    await loan.save();
    res.json({ message: 'Payment recorded successfully', payment, loan });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
