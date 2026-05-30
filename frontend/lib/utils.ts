import { LoanStatus } from '@/types';

export const statusConfig: Record<LoanStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  APPLIED:    { label: 'Applied',    color: 'text-blue-400',   bg: 'bg-blue-900/40',   border: 'border-blue-700',   dot: 'bg-blue-400' },
  SANCTIONED: { label: 'Sanctioned', color: 'text-teal-400',   bg: 'bg-teal-900/40',   border: 'border-teal-700',   dot: 'bg-teal-400' },
  REJECTED:   { label: 'Rejected',   color: 'text-red-400',    bg: 'bg-red-900/40',    border: 'border-red-700',    dot: 'bg-red-400' },
  DISBURSED:  { label: 'Disbursed',  color: 'text-violet-400', bg: 'bg-violet-900/40', border: 'border-violet-700', dot: 'bg-violet-400' },
  CLOSED:     { label: 'Closed',     color: 'text-slate-300',  bg: 'bg-slate-700/40',  border: 'border-slate-600',  dot: 'bg-slate-300' },
};

export const getStatusConfig = (status: LoanStatus) => statusConfig[status] ?? statusConfig['APPLIED'];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const LOAN_STATUSES: LoanStatus[] = ['APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'];

export const getDashboardPath = (role: string) => {
  switch (role) {
    case 'BORROWER':     return '/borrower';
    case 'SALES':        return '/ops/sales';
    case 'SANCTION':     return '/ops/sanction';
    case 'DISBURSEMENT': return '/ops/disbursement';
    case 'COLLECTION':   return '/ops/collection';
    case 'ADMIN':        return '/admin';
    default:             return '/auth/login';
  }
};
