export type UserRole = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';

// PDF-compliant loan statuses:
// APPLIED → SANCTIONED → DISBURSED → CLOSED
// APPLIED → REJECTED  (sanction rejection)
// LEAD is a virtual state (no application yet, user just registered)
export type LoanStatus =
  | 'APPLIED'
  | 'SANCTIONED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CLOSED';

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'BUSINESS';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
