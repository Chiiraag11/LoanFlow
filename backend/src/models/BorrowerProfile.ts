import mongoose, { Schema, Document } from 'mongoose';
import { EmploymentMode } from '../types';

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  createdAt: Date;
  updatedAt: Date;
}

const BorrowerProfileSchema = new Schema<IBorrowerProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true },
  pan: { type: String, required: true, uppercase: true, trim: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
  dateOfBirth: { type: Date, required: true },
  monthlySalary: { type: Number, required: true, min: 0 },
  employmentMode: { type: String, enum: ['SALARIED','SELF_EMPLOYED','UNEMPLOYED','BUSINESS'], required: true },
}, { timestamps: true });

export default mongoose.model<IBorrowerProfile>('BorrowerProfile', BorrowerProfileSchema);
