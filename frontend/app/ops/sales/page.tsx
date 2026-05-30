"use client";
import { useState } from "react";
import { OpsLayout } from "@/components/layout/OpsLayout";
import { dashboardAPI } from "@/lib/api";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { KPICard } from "@/components/ui/KPICard";
import { Users, Search, Mail, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function SalesPage() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Simple debounce via useEffect-free approach: query key uses debounced value
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["salesLeads", page, debouncedSearch],
    queryFn: () => dashboardAPI.getLeads({ page, limit: 10, search: debouncedSearch }).then((r) => r.data),
  });

  const leads: User[] = data?.leads ?? [];
  const total: number = data?.total ?? 0;
  const pages: number = data?.pages ?? 1;

  return (
    <OpsLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sales Leads</h1>
          <p className="text-slate-400 mt-1">Users who registered but haven&apos;t applied for a loan yet</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KPICard title="Total Leads" value={total} icon={<Users size={20} />} color="#14B8A6" subtitle="Registered, not applied" />
          <KPICard title="Conversion Rate" value="—" icon={<Users size={20} />} color="#6366F1" />
          <KPICard title="This Week" value="—" icon={<Users size={20} />} color="#F59E0B" />
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input-field pl-10" placeholder="Search by name or email…"
              value={search} onChange={(e) => handleSearch(e.target.value)} />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Borrower","Email","Registered On","Status"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-teal-400 mx-auto" />
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No leads found</td></tr>
                ) : leads.map((lead, i) => (
                  <motion.tr key={lead._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}>
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Mail size={13} />{lead.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(lead.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Lead
                      </span>
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
    </OpsLayout>
  );
}
