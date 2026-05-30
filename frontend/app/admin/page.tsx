"use client";
import { OpsLayout } from "@/components/layout/OpsLayout";
import { dashboardAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoanStatus } from "@/types";
import { Users, TrendingUp, DollarSign, CheckCircle, BarChart2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const STATUS_ORDER: LoanStatus[] = ["APPLIED","SANCTIONED","REJECTED","DISBURSED","CLOSED"];

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => dashboardAPI.getStats().then((r) => r.data),
    meta: { onError: () => toast.error("Failed to load stats") },
  });

  if (isLoading) return (
    <OpsLayout>
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-teal-400" />
      </div>
    </OpsLayout>
  );

  const statusMap: Record<string, number> = {};
  stats?.statusCounts?.forEach((s: any) => { statusMap[s._id] = s.count; });

  return (
    <OpsLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Full platform overview and loan funnel analytics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "Total Borrowers", value: stats?.totalBorrowers ?? 0, icon: <Users size={20} />,     color: "#14B8A6" },
            { title: "Total Loans",     value: stats?.totalLoans ?? 0,     icon: <TrendingUp size={20} />, color: "#6366F1" },
            { title: "Active (Disbursed)", value: stats?.activeLoans ?? 0, icon: <BarChart2 size={20} />,  color: "#F59E0B" },
            { title: "Total Disbursed", value: formatCurrency(stats?.totalDisbursed ?? 0), icon: <DollarSign size={20} />, color: "#22C55E" },
          ].map((kpi, i) => (
            <motion.div key={kpi.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Funnel */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Loan Pipeline Funnel</h2>
            <div className="space-y-3">
              {STATUS_ORDER.map((status, i) => {
                const count = statusMap[status] || 0;
                const max   = Math.max(...Object.values(statusMap), 1);
                const pct   = Math.round((count / max) * 100);
                return (
                  <motion.div key={status} className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div className="w-32 flex-shrink-0"><StatusBadge status={status} /></div>
                    <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{ background: "linear-gradient(90deg,rgba(20,184,166,0.6),rgba(99,102,241,0.6))" }}
                        initial={{ width: 0 }} animate={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                        transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}>
                        {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                      </motion.div>
                    </div>
                    {count === 0 && <span className="text-xs text-slate-700 w-4">0</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Outcomes */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Loan Outcomes</h2>
            <div className="space-y-4">
              {[
                { label: "Closed (Repaid)",    value: stats?.closedLoans ?? 0,        color: "#22C55E" },
                { label: "Active (Disbursed)", value: stats?.activeLoans ?? 0,         color: "#14B8A6" },
                { label: "Rejected",           value: statusMap["REJECTED"] ?? 0,      color: "#EF4444" },
                { label: "Pending Sanction",   value: statusMap["APPLIED"] ?? 0,       color: "#F59E0B" },
              ].map((item, i) => (
                <motion.div key={item.label} className="flex items-center gap-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="flex-1 text-sm text-slate-400">{item.label}</span>
                  <span className="text-white font-bold text-lg w-12 text-right">{item.value}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Loans</span>
                <span className="text-white font-semibold">{stats?.totalLoans ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-500">Closure Rate</span>
                <span className="font-semibold" style={{ color: "#22C55E" }}>
                  {stats?.totalLoans > 0 ? Math.round(((stats?.closedLoans ?? 0) / stats.totalLoans) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Sales Leads",    href: "/ops/sales",        color: "#14B8A6", desc: "View registered users" },
            { label: "Sanction Queue", href: "/ops/sanction",     color: "#6366F1", desc: "Approve / reject loans" },
            { label: "Disbursement",   href: "/ops/disbursement", color: "#22C55E", desc: "Disburse sanctioned loans" },
            { label: "Collection",     href: "/ops/collection",   color: "#F59E0B", desc: "Record payments" },
          ].map((item, i) => (
            <motion.a key={item.href} href={item.href}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass-card p-5 hover:bg-white/[0.04] transition-all group cursor-pointer block">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              </div>
              <p className="text-white font-semibold text-sm group-hover:text-teal-400 transition-colors">{item.label}</p>
              <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </OpsLayout>
  );
}
