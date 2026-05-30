import mongoose, { Schema, Document } from 'mongoose';
import { LoanStatus } from '../types';

export interface ILoanApplication extends Document {
  borrowerId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  disbursementExecutive?: string;
  amountPaid: number;
  outstandingBalance: number;
  closedAt?: Date;
  documentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LoanApplicationSchema = new Schema<ILoanApplication>({
  borrowerId:            { type: Schema.Types.ObjectId, ref: 'User',           required: true, index: true },
  profileId:             { type: Schema.Types.ObjectId, ref: 'BorrowerProfile', required: true },
  loanAmount:            { type: Number, required: true, min: 50000, max: 500000 },
  tenure:                { type: Number, required: true, min: 30, max: 365 },
  interestRate:          { type: Number, default: 12 },
  simpleInterest:        { type: Number, required: true },
  totalRepayment:        { type: Number, required: true },
  status:                { type: String, enum: ['APPLIED','SANCTIONED','REJECTED','DISBURSED','CLOSED'], default: 'APPLIED', index: true },
  rejectionReason:       { type: String },
  sanctionedBy:          { type: Schema.Types.ObjectId, ref: 'User' },
  sanctionedAt:          { type: Date },
  disbursedBy:           { type: Schema.Types.ObjectId, ref: 'User' },
  disbursedAt:           { type: Date },
  disbursementExecutive: { type: String },
  amountPaid:            { type: Number, default: 0 },
  outstandingBalance:    { type: Number },
  closedAt:              { type: Date },
  documentId:            { type: Schema.Types.ObjectId, ref: 'Document' },
}, { timestamps: true });

export default mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);
