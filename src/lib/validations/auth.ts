import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address.")
      .max(120, "Email must not exceed 120 characters."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must not exceed 128 characters."),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must not exceed 100 characters."),
  })
  .strip();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strip();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
