import { LoanStatus } from '../types';

// PDF-compliant state machine:
// APPLIED → SANCTIONED (sanction approval)
// APPLIED → REJECTED   (sanction rejection)
// SANCTIONED → DISBURSED
// DISBURSED → CLOSED   (auto-close on full repayment)
const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  APPLIED:    ['SANCTIONED', 'REJECTED'],
  SANCTIONED: ['DISBURSED'],
  REJECTED:   [],
  DISBURSED:  ['CLOSED'],
  CLOSED:     [],
};

export const canTransition = (from: LoanStatus, to: LoanStatus): boolean => {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

export const validateTransition = (from: LoanStatus, to: LoanStatus): void => {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
};
