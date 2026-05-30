export type UserRole = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

// PDF-compliant statuses: APPLIED → SANCTIONED → DISBURSED → CLOSED, APPLIED → REJECTED
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'BUSINESS';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface BorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  createdAt: string;
}

export interface LoanApplication {
  _id: string;
  borrowerId: User | string;
  profileId: BorrowerProfile | string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: User | string;
  sanctionedAt?: string;
  disbursedBy?: User | string;
  disbursedAt?: string;
  disbursementExecutive?: string;
  amountPaid: number;
  outstandingBalance: number;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loanApplicationId: string;
  borrowerId: string;
  collectedBy: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export interface StatusHistory {
  _id: string;
  loanApplicationId: string;
  fromStatus?: LoanStatus;
  toStatus: LoanStatus;
  changedBy: User;
  reason?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
