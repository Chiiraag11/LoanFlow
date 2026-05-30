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
import { Banknote, Loader2, FileText, CheckCircle, DollarSign, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function DisbursementPage() {
  const [page, setPage]           = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [executive, setExecutive] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sanctionedLoans", page],
    queryFn: () => loanAPI.getSanctioned({ page, limit: 10 }).then((r) => r.data),
  });

  const loans: LoanApplication[] = data?.loans ?? [];
  const total: number            = data?.total ?? 0;
  const pages: number            = data?.pages ?? 1;

  const disburseMutation = useMutation({
    mutationFn: ({ id, exec }: { id: string; exec: string }) =>
      loanAPI.disburse(id, { disbursementExecutive: exec }),
    onSuccess: () => {
      toast.success("Loan disbursed successfully!");
      qc.invalidateQueries({ queryKey: ["sanctionedLoans"] });
      setSelectedLoan(null);
      setExecutive("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Disbursement failed"),
  });

  const getBorrowerName = (loan: LoanApplication) =>
    typeof loan.borrowerId === "object" ? (loan.borrowerId as any).name : "—";
  const getProfileField = (loan: LoanApplication, field: string) =>
    typeof loan.profileId === "object" ? (loan.profileId as any)[field] : "—";

  return (
    <OpsLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Disbursement</h1>
          <p className="text-slate-400 mt-1">Disburse sanctioned loans to borrowers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPICard title="Ready to Disburse" value={total}
            icon={<Banknote size={20} />} color="#14B8A6" />
          <KPICard title="Transition" value="SANCTIONED → DISBURSED"
            icon={<CheckCircle size={20} />} color="#6366F1" />
          <KPICard title="Total Value" value={formatCurrency(loans.reduce((s, l) => s + l.loanAmount, 0))}
            icon={<DollarSign size={20} />} color="#22C55E" />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Borrower","Loan Amount","Tenure","Total Repayment","Sanctioned On","Status","Action"].map((h) => (
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
                    <p className="text-slate-500">No sanctioned loans pending disbursement</p>
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
                          style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}>
                          {getBorrowerName(loan).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{getBorrowerName(loan)}</p>
                          <p className="text-xs text-slate-500">{getProfileField(loan, "employmentMode")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{loan.tenure} days</td>
                    <td className="px-5 py-4 text-slate-300 text-sm">{formatCurrency(loan.totalRepayment)}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {loan.sanctionedAt ? formatDate(loan.sanctionedAt) : "—"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={loan.status} /></td>
                    <td className="px-5 py-4">
                      <button onClick={() => { setSelectedLoan(loan); setExecutive(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.25)" }}>
                        <Banknote size={13} /> Disburse
                      </button>
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

      <Modal isOpen={!!selectedLoan} onClose={() => setSelectedLoan(null)} title="Disburse Loan" size="sm">
        {selectedLoan && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-slate-400" />
                <span className="text-sm font-medium text-white">{getBorrowerName(selectedLoan)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><DollarSign size={12} />Loan Amount</span>
                <span className="text-white font-semibold">{formatCurrency(selectedLoan.loanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><Calendar size={12} />Tenure</span>
                <span className="text-white">{selectedLoan.tenure} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Repayment</span>
                <span className="font-semibold" style={{ color: "#14B8A6" }}>{formatCurrency(selectedLoan.totalRepayment)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Disbursement Executive</label>
              <input className="input-field" placeholder="Executive name (optional)"
                value={executive} onChange={(e) => setExecutive(e.target.value)} />
            </div>

            <div className="p-3 rounded-xl text-sm"
              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
              <p className="text-teal-400 font-medium mb-1">Confirm Disbursement</p>
              <p className="text-slate-400">Loan moves to DISBURSED status. Disbursement date will be today.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelectedLoan(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => disburseMutation.mutate({ id: selectedLoan._id, exec: executive })}
                className="btn-primary flex-1" disabled={disburseMutation.isPending}>
                {disburseMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                {disburseMutation.isPending ? "Processing…" : "Confirm Disburse"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </OpsLayout>
  );
}
