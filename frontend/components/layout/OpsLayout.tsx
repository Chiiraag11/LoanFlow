"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, CheckSquare, Banknote, CreditCard,
  LayoutDashboard, LogOut, ChevronRight
} from "lucide-react";

const navItems: Record<string, { label: string; icon: any; href: string; roles: string[] }[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin", roles: ["ADMIN"] },
    { label: "Sales Leads", icon: Users, href: "/ops/sales", roles: ["ADMIN"] },
    { label: "Sanction", icon: CheckSquare, href: "/ops/sanction", roles: ["ADMIN"] },
    { label: "Disbursement", icon: Banknote, href: "/ops/disbursement", roles: ["ADMIN"] },
    { label: "Collection", icon: CreditCard, href: "/ops/collection", roles: ["ADMIN"] },
  ],
  ops: [
    { label: "Sales Leads", icon: Users, href: "/ops/sales", roles: ["SALES"] },
    { label: "Sanction", icon: CheckSquare, href: "/ops/sanction", roles: ["SANCTION"] },
    { label: "Disbursement", icon: Banknote, href: "/ops/disbursement", roles: ["DISBURSEMENT"] },
    { label: "Collection", icon: CreditCard, href: "/ops/collection", roles: ["COLLECTION"] },
  ],
};

// Maps each protected path to the roles that are allowed to access it
const PAGE_ROLE_MAP: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/ops/sales": ["ADMIN", "SALES"],
  "/ops/sanction": ["ADMIN", "SANCTION"],
  "/ops/disbursement": ["ADMIN", "DISBURSEMENT"],
  "/ops/collection": ["ADMIN", "COLLECTION"],
};

export function OpsLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → login page
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Borrower → borrower portal
    if (user.role === "BORROWER") {
      router.replace("/borrower");
      return;
    }

    // Check page-level role access
    const allowedRoles = PAGE_ROLE_MAP[pathname];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their own allowed page
      const ownPage = navItems.ops.find(i => i.roles.includes(user.role));
      router.replace(ownPage ? ownPage.href : "/auth/login");
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) return null;

  const items = user.role === "ADMIN" ? navItems.admin : navItems.ops.filter(i => i.roles.includes(user.role));

  return (
    <div className="min-h-screen flex" style={{ background: "#0F172A" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: "linear-gradient(180deg, #0D1B36 0%, #0F172A 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#14B8A6,#0D9488)" }}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base">LoanFlow</span>
              <p className="text-xs text-slate-500">Operations</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6366F1,#4F46E5)" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                style={{ background: "rgba(20,184,166,0.15)", color: "#14B8A6" }}>{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                style={active ? { background: "rgba(20,184,166,0.15)", color: "#14B8A6", border: "1px solid rgba(20,184,166,0.2)" } : {}}>
                <item.icon size={17} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
