import mongoose, { Schema, Document as MongoDoc } from 'mongoose';

export interface IDocument extends MongoDoc {
  borrowerId: mongoose.Types.ObjectId;
  loanApplicationId?: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  loanApplicationId: { type: Schema.Types.ObjectId, ref: 'LoanApplication' },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IDocument>('Document', DocumentSchema);
