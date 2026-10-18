import { z } from "zod";

export const addressInputSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must not exceed 100 characters."),
    addressLine1: z
      .string()
      .trim()
      .min(3, "Street address must be at least 3 characters.")
      .max(150, "Street address must not exceed 150 characters."),
    city: z
      .string()
      .trim()
      .min(2, "City must be at least 2 characters.")
      .max(80, "City must not exceed 80 characters."),
    postalCode: z
      .string()
      .trim()
      .min(2, "Postal code must be at least 2 characters.")
      .max(20, "Postal code must not exceed 20 characters."),
    country: z
      .string()
      .trim()
      .min(2, "Country must be at least 2 characters.")
      .max(80, "Country must not exceed 80 characters."),
    isDefault: z.boolean().default(false),
  })
  .strip();

export const updateAddressSchema = addressInputSchema.partial();

export type AddressInput = z.infer<typeof addressInputSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
