import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  loanApplicationId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  collectedBy: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  loanApplicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication', required: true, index: true },
  borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  utrNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  amount: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, required: true },
}, { timestamps: true });

PaymentSchema.index({ utrNumber: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
