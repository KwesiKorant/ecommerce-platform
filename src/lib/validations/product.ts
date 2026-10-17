import { z } from "zod";

export const createProductSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters.")
      .max(120, "Title must not exceed 120 characters."),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase alphanumeric characters and hyphens.")
      .max(140, "Slug must not exceed 140 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(2500, "Description must not exceed 2500 characters."),
    price: z
      .number()
      .positive("Price must be greater than zero.")
      .max(999999.99, "Price exceeds maximum supported threshold ($999,999.99).")
      .refine(
        (val) => {
          const parts = val.toString().split(".");
          return parts.length < 2 || parts[1].length <= 2;
        },
        { message: "Price precision must not exceed 2 decimal places." }
      ),
    stock: z
      .number()
      .int("Stock count must be a whole integer.")
      .min(0, "Stock count cannot be negative.")
      .max(50000, "Stock count exceeds maximum storage capacity (50,000 units)."),
    imageUrl: z
      .string()
      .trim()
      .url("Image URL must be a valid HTTP/HTTPS URL.")
      .max(500, "Image URL must not exceed 500 characters."),
    categoryId: z.string().min(1, "Product category is required."),
    isActive: z.boolean().default(true),
  })
  .strip();

export const updateProductSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters.")
      .max(120, "Title must not exceed 120 characters.")
      .optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase alphanumeric characters and hyphens.")
      .max(140, "Slug must not exceed 140 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(2500, "Description must not exceed 2500 characters.")
      .optional(),
    price: z
      .number()
      .positive("Price must be greater than zero.")
      .max(999999.99, "Price exceeds maximum supported threshold ($999,999.99).")
      .refine(
        (val) => {
          const parts = val.toString().split(".");
          return parts.length < 2 || parts[1].length <= 2;
        },
        { message: "Price precision must not exceed 2 decimal places." }
      )
      .optional(),
    stock: z
      .number()
      .int("Stock count must be a whole integer.")
      .min(0, "Stock count cannot be negative.")
      .max(50000, "Stock count exceeds maximum storage capacity (50,000 units).")
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .url("Image URL must be a valid HTTP/HTTPS URL.")
      .max(500, "Image URL must not exceed 500 characters.")
      .optional(),
    categoryId: z.string().min(1, "Product category is required.").optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .strip();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
