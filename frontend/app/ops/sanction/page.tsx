"use client";
import { useState } from "react";
import { OpsLayout } from "@/components/layout/OpsLayout";
import { loanAPI } from "@/lib/api";
import { LoanApplication } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { KPICard } from "@/components/ui/KPICard";
import { CheckSquare, XCircle, CheckCircle, Loader2, FileText, DollarSign, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function SanctionPage() {
  const [page, setPage]           = useState(1);
  const [actionLoan, setActionLoan] = useState<LoanApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["appliedLoans", page],
    queryFn: () => loanAPI.getApplied({ page, limit: 10 }).then((r) => r.data),
  });

  const loans: LoanApplication[] = data?.loans ?? [];
  const total: number            = data?.total ?? 0;
  const pages: number            = data?.pages ?? 1;

  const sanctionMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      loanAPI.sanction(id, { action, rejectionReason: reason }),
    onSuccess: (_, vars) => {
      toast.success(`Loan ${vars.action === "approve" ? "sanctioned" : "rejected"} successfully`);
      qc.invalidateQueries({ queryKey: ["appliedLoans"] });
      setActionLoan(null);
      setActionType(null);
      setRejectionReason("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Action failed"),
  });

  const handleAction = () => {
    if (!actionLoan || !actionType) return;
    if (actionType === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    sanctionMutation.mutate({
      id: actionLoan._id,
      action: actionType,
      reason: actionType === "reject" ? rejectionReason : undefined,
    });
  };

  const openAction = (loan: LoanApplication, type: "approve" | "reject") => {
    setActionLoan(loan); setActionType(type); setRejectionReason("");
  };

  const getBorrowerName = (loan: LoanApplication) =>
    typeof loan.borrowerId === "object" ? (loan.borrowerId as any).name : "—";
  const getProfileField = (loan: LoanApplication, field: string) =>
    typeof loan.profileId === "object" ? (loan.profileId as any)[field] : "—";

  return (
    <OpsLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Loan Sanction</h1>
          <p className="text-slate-400 mt-1">Review and approve or reject applied loan applications</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPICard title="Pending Review" value={total}                         icon={<CheckSquare size={20} />} color="#6366F1" />
          <KPICard title="Approve"        value="APPLIED → SANCTIONED"          icon={<CheckCircle size={20} />} color="#22C55E" />
          <KPICard title="Reject"         value="APPLIED → REJECTED"            icon={<XCircle    size={20} />} color="#EF4444" />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Borrower","Loan Amount","Tenure","Salary","Applied On","Status","Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-teal-400 mx-auto" />
                  </td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center">
                    <FileText size={40} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-500">No pending applications</p>
                  </td></tr>
                ) : loans.map((loan, i) => (
                  <motion.tr key={loan._id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#14B8A6,#0D9488)" }}>
                          {getBorrowerName(loan).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{getBorrowerName(loan)}</p>
                          <p className="text-xs text-slate-500">{getProfileField(loan, "pan")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white font-semibold">{formatCurrency(loan.loanAmount)}</span>
                      <p className="text-xs text-slate-500 mt-0.5">SI: {formatCurrency(loan.simpleInterest)}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{loan.tenure} days</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">
                      {formatCurrency(getProfileField(loan, "monthlySalary") || 0)}/mo
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{formatDate(loan.createdAt)}</td>
                    <td className="px-5 py-4"><StatusBadge status={loan.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openAction(loan, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => openAction(loan, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <Modal isOpen={!!actionLoan} onClose={() => { setActionLoan(null); setActionType(null); }}
        title={actionType === "approve" ? "Sanction Loan" : "Reject Loan"} size="sm">
        {actionLoan && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-slate-400" />
                <span className="text-sm font-medium text-white">{getBorrowerName(actionLoan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><DollarSign size={12} />Amount</span>
                <span className="text-white font-semibold">{formatCurrency(actionLoan.loanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><Calendar size={12} />Tenure</span>
                <span className="text-white">{actionLoan.tenure} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Repayment</span>
                <span className="text-white">{formatCurrency(actionLoan.totalRepayment)}</span>
              </div>
            </div>

            {actionType === "reject" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea className="input-field resize-none" rows={3}
                  placeholder="Provide a clear reason for rejection…"
                  value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
            )}

            {actionType === "approve" && (
              <div className="p-3 rounded-xl text-sm"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-green-400 font-medium mb-1">Confirm Sanction</p>
                <p className="text-slate-400">This will move the loan to SANCTIONED status.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setActionLoan(null); setActionType(null); }} className="btn-secondary flex-1">Cancel</button>
              {actionType === "approve" ? (
                <button onClick={handleAction} className="btn-success flex-1" disabled={sanctionMutation.isPending}>
                  {sanctionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {sanctionMutation.isPending ? "Processing…" : "Sanction Loan"}
                </button>
              ) : (
                <button onClick={handleAction} className="btn-danger flex-1" disabled={sanctionMutation.isPending}>
                  {sanctionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  {sanctionMutation.isPending ? "Processing…" : "Reject Loan"}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </OpsLayout>
  );
}
