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
import { CreditCard, Loader2, FileText, DollarSign, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, PaymentFormValues } from "@/lib/schemas";
import { motion } from "framer-motion";

export default function CollectionPage() {
  const [page, setPage]                 = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["activeLoans", page],
    queryFn: () => loanAPI.getActive({ page, limit: 10 }).then((r) => r.data),
  });

  const loans: LoanApplication[] = data?.loans ?? [];
  const total: number            = data?.total ?? 0;
  const pages: number            = data?.pages ?? 1;

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalCollected   = loans.reduce((s, l) => s + l.amountPaid, 0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentDate: new Date().toISOString().split("T")[0] },
  });

  const watchAmount = watch("amount");

  const recordPayment = useMutation({
    mutationFn: (data: PaymentFormValues) =>
      loanAPI.recordPayment(selectedLoan!._id, {
        utrNumber:   data.utrNumber.toUpperCase(),
        amount:      Number(data.amount),
        paymentDate: data.paymentDate,
      }),
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      qc.invalidateQueries({ queryKey: ["activeLoans"] });
      setSelectedLoan(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Payment failed");
    },
  });

  const openPayModal = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    reset({ utrNumber: "", amount: undefined as any, paymentDate: new Date().toISOString().split("T")[0] });
  };

  const getBorrowerName = (loan: LoanApplication) =>
    typeof loan.borrowerId === "object" ? (loan.borrowerId as any).name : "—";

  const isFullPayment = selectedLoan && Number(watchAmount || 0) >= selectedLoan.outstandingBalance;

  return (
    <OpsLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Collection</h1>
          <p className="text-slate-400 mt-1">Record payments and track loan repayments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPICard title="Active Loans"    value={total}                        icon={<CreditCard size={20} />} color="#6366F1" />
          <KPICard title="Outstanding"     value={formatCurrency(totalOutstanding)} icon={<DollarSign size={20} />} color="#F59E0B" />
          <KPICard title="Total Collected" value={formatCurrency(totalCollected)}   icon={<CreditCard size={20} />} color="#22C55E" />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Borrower","Principal","Total Repayment","Paid","Outstanding","Progress","Status","Action"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-teal-400 mx-auto" />
                  </td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center">
                    <FileText size={40} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-500">No active loans for collection</p>
                  </td></tr>
                ) : loans.map((loan, i) => {
                  const progress = Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100);
                  return (
                    <motion.tr key={loan._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
                            {getBorrowerName(loan).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{getBorrowerName(loan)}</p>
                            <p className="text-xs text-slate-500">{loan.tenure}d tenure</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-sm">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-4 py-4 text-white text-sm font-medium">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: "#22C55E" }}>{formatCurrency(loan.amountPaid)}</td>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: "#F59E0B" }}>{formatCurrency(loan.outstandingBalance)}</td>
                      <td className="px-4 py-4 min-w-[100px]">
                        <div className="h-1.5 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <motion.div className="h-1.5 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }}
                            style={{ background: progress >= 100 ? "#22C55E" : "linear-gradient(90deg,#14B8A6,#6366F1)" }} />
                        </div>
                        <span className="text-xs text-slate-600">{Math.round(progress)}%</span>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={loan.status} /></td>
                      <td className="px-4 py-4">
                        {loan.status !== "CLOSED" && (
                          <button onClick={() => openPayModal(loan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.25)" }}>
                            <CreditCard size={13} /> Record
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Payment Modal — React Hook Form + Zod */}
      <Modal isOpen={!!selectedLoan} onClose={() => { setSelectedLoan(null); reset(); }} title="Record Payment" size="sm">
        {selectedLoan && (
          <form onSubmit={handleSubmit((d) => recordPayment.mutate(d as any))} className="space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-sm font-medium text-white mb-2">{getBorrowerName(selectedLoan)}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Outstanding Balance</span>
                <span className="font-bold" style={{ color: "#F59E0B" }}>{formatCurrency(selectedLoan.outstandingBalance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Repayment</span>
                <span className="text-white">{formatCurrency(selectedLoan.totalRepayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid So Far</span>
                <span style={{ color: "#22C55E" }}>{formatCurrency(selectedLoan.amountPaid)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                UTR Number <span className="text-red-400">*</span>
              </label>
              <input {...register("utrNumber")} className="input-field font-mono uppercase"
                placeholder="e.g. UTR123456789012" />
              {errors.utrNumber && <p className="mt-1 text-xs text-red-400">{errors.utrNumber.message}</p>}
              <p className="text-xs text-slate-600 mt-1">Must be globally unique</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (₹) <span className="text-red-400">*</span>
              </label>
              <input {...register("amount")} type="number" className="input-field"
                placeholder={`Max: ${selectedLoan.outstandingBalance}`}
                min={1} max={selectedLoan.outstandingBalance} />
              {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input {...register("paymentDate")} type="date" className="input-field" />
              {errors.paymentDate && <p className="mt-1 text-xs text-red-400">{errors.paymentDate.message}</p>}
            </div>

            {isFullPayment && (
              <div className="p-3 rounded-xl text-sm"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-green-400 font-medium">🎉 Full payment — loan will auto-close!</p>
              </div>
            )}

            {recordPayment.isError && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-400">
                  {(recordPayment.error as any)?.response?.data?.message || "Payment failed"}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setSelectedLoan(null); reset(); }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {recordPayment.isPending ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </OpsLayout>
  );
}
