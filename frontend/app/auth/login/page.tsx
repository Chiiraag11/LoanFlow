"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getDashboardPath } from "@/lib/utils";
import { Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/schemas";
import { useState } from "react";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const res = await authAPI.login(data);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.replace(getDashboardPath(res.data.user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const demoCredentials = [
    { role: "Admin",        email: "admin@example.com",       password: "Password@123" },
    { role: "Sales",        email: "sales@example.com",       password: "Password@123" },
    { role: "Sanction",     email: "sanction@example.com",    password: "Password@123" },
    { role: "Disbursement", email: "disbursement@example.com",password: "Password@123" },
    { role: "Collection",   email: "collection@example.com",  password: "Password@123" },
    { role: "Borrower",     email: "borrower@example.com",    password: "Password@123" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#0F172A" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1B36 0%, #0F172A 50%, #0D1B2A 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #14B8A6, transparent)" }} />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #6366F1, transparent)" }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #14B8A6, #0D9488)" }}>
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">LoanFlow</span>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Smart Lending,<br />
            <span style={{ color: "#14B8A6" }}>Seamless Operations</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            From borrower onboarding to loan closure — all in one intelligent platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {["₹5L+ Loans", "6 User Roles", "Full RBAC"].map((stat) => (
              <div key={stat} className="glass-card p-4 text-center">
                <span className="text-sm font-semibold" style={{ color: "#14B8A6" }}>{stat}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-sm relative">© 2026 LoanFlow. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  {...register("email")}
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    className="input-field"
                    placeholder="••••••••"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-slate-400 text-sm mt-6">
              New borrower?{" "}
              <Link href="/auth/signup" className="font-medium" style={{ color: "#14B8A6" }}>
                Create account
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 glass-card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Demo Credentials — all passwords: <span style={{ color: "#14B8A6" }}>Password@123</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => { setValue("email", cred.email); setValue("password", cred.password); }}
                  className="text-left p-2 rounded-lg transition-colors hover:bg-white/5"
                >
                  <span className="block text-xs font-semibold" style={{ color: "#14B8A6" }}>{cred.role}</span>
                  <span className="block text-xs text-slate-500 truncate">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
