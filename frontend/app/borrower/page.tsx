"use client";
import { useState, useEffect } from "react";
import { BorrowerLayout } from "@/components/layout/BorrowerLayout";
import { profileAPI, documentAPI, loanAPI } from "@/lib/api";
import { LoanApplication } from "@/types";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoanTimeline } from "@/components/ui/LoanTimeline";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "@/lib/schemas";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, UploadCloud, DollarSign, CheckCircle, KeyRound,
  Loader2, AlertCircle, ArrowRight, ChevronDown, ChevronUp
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Authentication",  icon: KeyRound },
  { id: 2, label: "Personal Details", icon: User },
  { id: 3, label: "Upload Salary Slip", icon: UploadCloud },
  { id: 4, label: "Loan Application",  icon: DollarSign },
];

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit:  { opacity: 0, x: -40 },
};

export default function BorrowerPage() {
  const [activeStep, setActiveStep]     = useState(2); // Step 1 (Auth) already complete
  const [docId, setDocId]               = useState<string | null>(null);
  const [uploadFile, setUploadFile]     = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [loanAmount, setLoanAmount]     = useState(100000);
  const [tenure, setTenure]             = useState(90);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [loanDetails, setLoanDetails]   = useState<Record<string, any>>({});

  const qc = useQueryClient();

  // ── TanStack Query: load profile + loans ──────────────────────────────────
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => profileAPI.get().then((r) => r.data.profile),
  });

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ["myLoans"],
    queryFn: () => loanAPI.myLoans().then((r) => r.data.loans as LoanApplication[]),
  });

  // Pre-fill form + advance step when profile is loaded
  useEffect(() => {
    if (profileData) {
      reset({
        fullName:       profileData.fullName,
        pan:            profileData.pan,
        dateOfBirth:    profileData.dateOfBirth.split("T")[0],
        monthlySalary:  profileData.monthlySalary,
        employmentMode: profileData.employmentMode,
      });
      if (activeStep === 2) setActiveStep(3);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData]);

  // If loans exist, jump to dashboard view
  useEffect(() => {
    if (loansData && loansData.length > 0) setActiveStep(5); // dashboard tab
  }, [loansData]);

  // ── React Hook Form: profile (step 2) ────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  const saveProfile = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      profileAPI.save({ ...data, pan: (data as any).pan.toUpperCase(), monthlySalary: Number((data as any).monthlySalary) }),
    onSuccess: () => {
      toast.success("Profile saved successfully!");
      qc.invalidateQueries({ queryKey: ["myProfile"] });
      setActiveStep(3);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.reason || err.response?.data?.message || "Failed to save profile";
      toast.error(msg);
    },
  });

  const applyLoan = useMutation({
    mutationFn: () => loanAPI.apply({ loanAmount, tenure, documentId: docId }),
    onSuccess: () => {
      toast.success("Loan application submitted!");
      qc.invalidateQueries({ queryKey: ["myLoans"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to apply");
    },
  });

  // ── Loan calculation ───────────────────────────────────────────────────────
  const si    = Math.round((loanAmount * 12 * tenure) / (365 * 100));
  const total = loanAmount + si;

  const handleUpload = async () => {
    if (!uploadFile) { toast.error("Please select a file"); return; }
    setUploadLoading(true);
    try {
      const res = await documentAPI.upload(uploadFile);
      setDocId(res.data.document._id);
      toast.success("Salary slip uploaded!");
      setActiveStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const loadLoanDetails = async (id: string) => {
    if (loanDetails[id]) { setExpandedLoan(expandedLoan === id ? null : id); return; }
    try {
      const res = await loanAPI.getById(id);
      setLoanDetails((prev) => ({ ...prev, [id]: res.data }));
      setExpandedLoan(id);
    } catch { toast.error("Failed to load loan details"); }
  };

  const isLoading = profileLoading || loansLoading;

  if (isLoading) {
    return (
      <BorrowerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-400" />
        </div>
      </BorrowerLayout>
    );
  }

  // ── Dashboard: existing loans ─────────────────────────────────────────────
  if (activeStep === 5 && loansData && loansData.length > 0) {
    return (
      <BorrowerLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Loans</h1>
            <p className="text-slate-400 mt-1">Track your loan applications and repayments</p>
          </div>

          <div className="space-y-4">
            {loansData.map((loan, i) => (
              <motion.div
                key={loan._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-6 cursor-pointer" onClick={() => loadLoanDetails(loan._id)}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.2)" }}>
                        <DollarSign size={22} style={{ color: "#14B8A6" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">{formatCurrency(loan.loanAmount)}</p>
                        <p className="text-sm text-slate-400">{loan.tenure} days · {loan.interestRate}% p.a.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={loan.status} />
                      <button className="text-slate-400">
                        {expandedLoan === loan._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {[
                      { label: "Total Repayment", value: formatCurrency(loan.totalRepayment), color: "text-white" },
                      { label: "Amount Paid",     value: formatCurrency(loan.amountPaid),     color: "text-green-400" },
                      { label: "Outstanding",     value: formatCurrency(loan.outstandingBalance), color: "text-yellow-400" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                        <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {loan.amountPaid > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Repayment Progress</span>
                        <span>{Math.round((loan.amountPaid / loan.totalRepayment) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div
                          className="h-1.5 rounded-full"
                          style={{ background: "linear-gradient(90deg,#14B8A6,#22C55E)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {expandedLoan === loan._id && loanDetails[loan._id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="pt-4 grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Journey</h3>
                            <LoanTimeline history={loanDetails[loan._id].history} currentStatus={loan.status} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Details</h3>
                            <div className="space-y-3">
                              {[
                                { label: "Applied On",   value: formatDate(loan.createdAt) },
                                { label: "Principal",    value: formatCurrency(loan.loanAmount) },
                                { label: "Interest",     value: formatCurrency(loan.simpleInterest) },
                                { label: "Total",        value: formatCurrency(loan.totalRepayment) },
                                ...(loan.disbursedAt ? [{ label: "Disbursed", value: formatDate(loan.disbursedAt) }] : []),
                                ...(loan.closedAt    ? [{ label: "Closed",    value: formatDate(loan.closedAt) }]    : []),
                              ].map((r) => (
                                <div key={r.label} className="flex justify-between text-sm">
                                  <span className="text-slate-500">{r.label}</span>
                                  <span className="text-white font-medium">{r.value}</span>
                                </div>
                              ))}
                            </div>
                            {loanDetails[loan._id].payments?.length > 0 && (
                              <div className="mt-6">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payments</h4>
                                {loanDetails[loan._id].payments.map((p: any) => (
                                  <div key={p._id} className="flex justify-between items-center p-3 rounded-lg mb-2"
                                    style={{ background: "rgba(255,255,255,0.04)" }}>
                                    <div>
                                      <p className="text-xs text-slate-400 font-mono">{p.utrNumber}</p>
                                      <p className="text-xs text-slate-600">{formatDate(p.paymentDate)}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-green-400">+{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {loan.rejectionReason && (
                              <div className="mt-4 p-3 rounded-lg"
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                <p className="text-xs text-red-400 font-semibold mb-1">Rejection Reason</p>
                                <p className="text-sm text-slate-300">{loan.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {loansData.every((l) => ["CLOSED", "REJECTED"].includes(l.status)) && (
            <div className="mt-6 glass-card p-6 text-center">
              <p className="text-slate-400 mb-4">All previous loans are closed. Apply for a new loan!</p>
              <button onClick={() => setActiveStep(profileData ? 4 : 2)} className="btn-primary">
                Apply for New Loan
              </button>
            </div>
          )}
        </motion.div>
      </BorrowerLayout>
    );
  }

  // ── Multi-step application ────────────────────────────────────────────────
  return (
    <BorrowerLayout>
      <div className="animate-fade-in">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((step, idx) => {
            const done    = activeStep > step.id;
            const current = activeStep === step.id;
            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    done    ? "bg-teal-500 border-teal-500 text-white" :
                    current ? "border-teal-500 text-teal-400 bg-teal-500/10" :
                              "border-slate-700 text-slate-600 bg-slate-800/50"
                  }`}>
                    {done ? <CheckCircle size={18} /> : <step.icon size={16} />}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap hidden sm:block ${
                    current ? "text-teal-400" : done ? "text-slate-400" : "text-slate-600"
                  }`}>{step.label}</span>
                </motion.div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 mb-5 ${done ? "bg-teal-500/50" : "bg-slate-700/50"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 2: Personal Details ── */}
          {activeStep === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="max-w-xl mx-auto glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-2">Personal Details</h2>
              <p className="text-slate-400 text-sm mb-6">We&apos;ll check your eligibility before proceeding</p>

              <form onSubmit={handleSubmit((d) => saveProfile.mutate(d as any))} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input {...register("fullName")} className="input-field" placeholder="As per PAN card" />
                  {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">PAN Number</label>
                  <input {...register("pan")} className="input-field uppercase" placeholder="ABCDE1234F" maxLength={10} />
                  {errors.pan && <p className="mt-1 text-xs text-red-400">{errors.pan.message}</p>}
                  <p className="text-xs text-slate-600 mt-1">5 letters + 4 digits + 1 letter</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
                  <input {...register("dateOfBirth")} type="date" className="input-field" />
                  {errors.dateOfBirth && <p className="mt-1 text-xs text-red-400">{errors.dateOfBirth.message}</p>}
                  <p className="text-xs text-slate-600 mt-1">Age must be between 23 and 50</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Salary (₹)</label>
                  <input {...register("monthlySalary")} type="number" className="input-field" placeholder="Minimum ₹25,000" />
                  {errors.monthlySalary && <p className="mt-1 text-xs text-red-400">{errors.monthlySalary.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Employment Mode</label>
                  <select {...register("employmentMode")} className="input-field">
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">Self Employed</option>
                    <option value="BUSINESS">Business Owner</option>
                    <option value="UNEMPLOYED">Unemployed</option>
                  </select>
                  {errors.employmentMode && <p className="mt-1 text-xs text-red-400">{errors.employmentMode.message}</p>}
                </div>

                {saveProfile.isError && (
                  <div className="p-3 rounded-xl flex gap-2"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">
                      {(saveProfile.error as any)?.response?.data?.reason ||
                       (saveProfile.error as any)?.response?.data?.message ||
                       "Eligibility check failed"}
                    </p>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full mt-2" disabled={profileSubmitting || saveProfile.isPending}>
                  {(profileSubmitting || saveProfile.isPending) ? <Loader2 size={16} className="animate-spin" /> : null}
                  {(profileSubmitting || saveProfile.isPending) ? "Checking Eligibility..." : "Continue"}
                  {!(profileSubmitting || saveProfile.isPending) && <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Step 3: Upload ── */}
          {activeStep === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="max-w-xl mx-auto glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-2">Upload Salary Slip</h2>
              <p className="text-slate-400 text-sm mb-6">Upload your latest salary slip as proof of income</p>

              <div className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-teal-500/50"
                style={{ borderColor: uploadFile ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                onClick={() => document.getElementById("fileInput")?.click()}>
                <input id="fileInput" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                <UploadCloud size={40} className="mx-auto mb-3" style={{ color: uploadFile ? "#14B8A6" : "#475569" }} />
                {uploadFile ? (
                  <div>
                    <p className="text-white font-medium">{uploadFile.name}</p>
                    <p className="text-sm text-slate-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-300 font-medium">Click to browse or drag & drop</p>
                    <p className="text-slate-500 text-sm mt-1">PDF, JPG, PNG · Max 5MB</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setActiveStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleUpload} className="btn-primary flex-1" disabled={!uploadFile || uploadLoading}>
                  {uploadLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {uploadLoading ? "Uploading..." : "Upload & Continue"}
                  {!uploadLoading && <ArrowRight size={16} />}
                </button>
              </div>
              {docId && (
                <button onClick={() => setActiveStep(4)}
                  className="w-full mt-3 text-sm text-slate-500 hover:text-slate-300 text-center transition-colors">
                  Skip (already uploaded) →
                </button>
              )}
            </motion.div>
          )}

          {/* ── Step 4: Loan Configuration ── */}
          {activeStep === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="max-w-2xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-8">
                  <h2 className="text-xl font-bold text-white mb-2">Loan Application</h2>
                  <p className="text-slate-400 text-sm mb-6">Configure your loan parameters</p>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Loan Amount: <span style={{ color: "#14B8A6" }}>{formatCurrency(loanAmount)}</span>
                      </label>
                      <input type="range" min={50000} max={500000} step={5000} value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#14B8A6" }} />
                      <div className="flex justify-between text-xs text-slate-600 mt-1"><span>₹50,000</span><span>₹5,00,000</span></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tenure: <span style={{ color: "#14B8A6" }}>{tenure} days</span>
                      </label>
                      <input type="range" min={30} max={365} step={5} value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#14B8A6" }} />
                      <div className="flex justify-between text-xs text-slate-600 mt-1"><span>30 days</span><span>365 days</span></div>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
                      <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
                      <p className="text-lg font-bold" style={{ color: "#14B8A6" }}>12% per annum (Fixed)</p>
                      <p className="text-xs text-slate-600 mt-0.5">SI = (P × R × T) / (365 × 100)</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setActiveStep(3)} className="btn-secondary">Back</button>
                    <button onClick={() => applyLoan.mutate()} className="btn-primary flex-1" disabled={applyLoan.isPending}>
                      {applyLoan.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                      {applyLoan.isPending ? "Submitting..." : "Apply Now"}
                    </button>
                  </div>
                </div>

                {/* Live calc panel */}
                <motion.div
                  className="glass-card p-8 flex flex-col justify-between"
                  key={`calc-${loanAmount}-${tenure}`}
                  initial={{ scale: 0.98 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Live Calculation</h3>
                    <div className="space-y-4">
                      {[
                        { label: "Principal", value: formatCurrency(loanAmount), color: "text-white" },
                        { label: "Simple Interest", value: formatCurrency(si), color: "text-yellow-400" },
                        { label: "Tenure", value: `${tenure} days`, color: "text-white" },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center py-3"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-slate-400">{row.label}</span>
                          <motion.span
                            key={row.value}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`font-semibold text-lg ${row.color}`}
                          >{row.value}</motion.span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 p-5 rounded-2xl text-center"
                    style={{ background: "linear-gradient(135deg,rgba(20,184,166,0.15),rgba(99,102,241,0.15))", border: "1px solid rgba(20,184,166,0.25)" }}>
                    <p className="text-sm text-slate-400 mb-1">Total Repayment</p>
                    <motion.p
                      key={total}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="text-4xl font-bold text-white"
                    >{formatCurrency(total)}</motion.p>
                    <p className="text-xs text-slate-500 mt-2">Principal + Interest</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BorrowerLayout>
  );
}
