import { EmploymentMode } from '../types';

interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

interface BREResult {
  passed: boolean;
  reason?: string;
}

export const runBRE = (input: BREInput): BREResult => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(input.pan.toUpperCase())) {
    return { passed: false, reason: 'Invalid PAN format. PAN must be in format: ABCDE1234F' };
  }

  if (input.employmentMode === 'UNEMPLOYED') {
    return { passed: false, reason: 'Unemployed applicants are not eligible for loans' };
  }

  if (input.monthlySalary < 25000) {
    return { passed: false, reason: `Monthly salary ₹${input.monthlySalary.toLocaleString()} is below minimum requirement of ₹25,000` };
  }

  const today = new Date();
  const dob = new Date(input.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  if (age < 23) {
    return { passed: false, reason: `Age ${age} is below minimum age requirement of 23 years` };
  }
  if (age > 50) {
    return { passed: false, reason: `Age ${age} exceeds maximum age limit of 50 years` };
  }

  return { passed: true };
};

export const calculateLoan = (principal: number, tenure: number) => {
  const rate = 12;
  const si = (principal * rate * tenure) / (365 * 100);
  const totalRepayment = principal + si;
  return { simpleInterest: Math.round(si), totalRepayment: Math.round(totalRepayment), interestRate: rate };
};
