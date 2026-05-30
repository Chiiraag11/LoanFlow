import { z } from "zod";

export const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name:            z.string().min(2, "Name must be at least 2 characters"),
  email:           z.string().email("Enter a valid email address"),
  password:        z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const profileSchema = z.object({
  fullName:       z.string().min(2, "Full name is required"),
  pan:            z.string().regex(PAN_REGEX, "Invalid PAN format (e.g. ABCDE1234F)"),
  dateOfBirth:    z.string().refine((d) => {
    if (!d) return false;
    const age = Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000));
    return age >= 23 && age <= 50;
  }, "Age must be between 23 and 50"),
  monthlySalary:  z.string().refine((v) => Number(v) >= 25000, "Minimum salary is ₹25,000"),
  employmentMode: z.enum(["SALARIED", "SELF_EMPLOYED", "BUSINESS"] as const).refine(
    (v) => v !== undefined,
    "Employment mode is required (cannot be Unemployed)"
  ),
});

export const loanSchema = z.object({
  loanAmount: z.number().min(50000, "Minimum ₹50,000").max(500000, "Maximum ₹5,00,000"),
  tenure:     z.number().min(30, "Minimum 30 days").max(365, "Maximum 365 days"),
});

export const paymentSchema = z.object({
  utrNumber:   z.string().min(1, "UTR number is required"),
  amount:      z.string().refine((v) => Number(v) > 0, "Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
});

export type LoginFormValues   = z.infer<typeof loginSchema>;
export type SignupFormValues  = z.infer<typeof signupSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type LoanFormValues    = z.infer<typeof loanSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
