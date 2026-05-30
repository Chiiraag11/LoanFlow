import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "LMS - Loan Management System",
  description: "Premium Fintech Loan Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1E293B',
                  color: '#F1F5F9',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#22C55E', secondary: '#0F172A' } },
                error:   { iconTheme: { primary: '#EF4444', secondary: '#0F172A' } },
              }}
            />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
