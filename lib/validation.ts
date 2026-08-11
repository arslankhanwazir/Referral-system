import { z } from "zod";

// Normalizes an email the same way everywhere it's touched, so uniqueness
// checks and lookups can never diverge by casing or stray whitespace.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
