import mongoose, { Schema, Document } from 'mongoose';
import { LoanStatus } from '../types';

export interface ILoanStatusHistory extends Document {
  loanApplicationId: mongoose.Types.ObjectId;
  fromStatus?: LoanStatus;
  toStatus: LoanStatus;
  changedBy: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const LoanStatusHistorySchema = new Schema<ILoanStatusHistory>({
  loanApplicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true, index: true },
  fromStatus:        { type: String },
  toStatus:          { type: String, required: true },
  changedBy:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason:            { type: String },
}, { timestamps: true });

export default mongoose.model<ILoanStatusHistory>('LoanStatusHistory', LoanStatusHistorySchema);
