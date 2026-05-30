import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
}

export function KPICard({ title, value, icon, color, subtitle, trend }: KPICardProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
