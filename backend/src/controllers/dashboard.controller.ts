import { Request, Response } from 'express';
import User from '../models/User';
import LoanApplication from '../models/LoanApplication';

export const getSalesLeads = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const borrowers = await User.find({ role: 'BORROWER' }).select('_id');
    const borrowerIds = borrowers.map(b => b._id);

    // Leads = borrowers who have no loan application at all (never applied)
    const appliedBorrowerIds = await LoanApplication.distinct('borrowerId', {
      borrowerId: { $in: borrowerIds },
    });

    const leadIds = borrowerIds.filter(id => !appliedBorrowerIds.map(String).includes(String(id)));

    const searchQuery: any = { _id: { $in: leadIds }, role: 'BORROWER' };
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(searchQuery)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(searchQuery);
    res.json({ leads: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [totalBorrowers, totalLoans, activeLoans, closedLoans, totalDisbursed] = await Promise.all([
      User.countDocuments({ role: 'BORROWER' }),
      LoanApplication.countDocuments(),
      LoanApplication.countDocuments({ status: 'DISBURSED' }),
      LoanApplication.countDocuments({ status: 'CLOSED' }),
      LoanApplication.aggregate([
        { $match: { status: { $in: ['DISBURSED', 'CLOSED'] } } },
        { $group: { _id: null, total: { $sum: '$loanAmount' } } },
      ]),
    ]);

    const statusCounts = await LoanApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ totalBorrowers, totalLoans, activeLoans, closedLoans, totalDisbursed: totalDisbursed[0]?.total || 0, statusCounts });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
