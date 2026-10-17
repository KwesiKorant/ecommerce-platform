import { z } from "zod";

export const orderItemInputSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required."),
    quantity: z
      .number()
      .int("Quantity must be a whole integer.")
      .min(1, "Quantity must be at least 1 unit.")
      .max(99, "Maximum allowed quantity per line item is 99 units."),
  })
  .strip(); // Strips out any injected client-submitted unitPrice or price properties

export const shippingAddressSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must not exceed 100 characters."),
    addressLine1: z
      .string()
      .trim()
      .min(3, "Address line 1 must be at least 3 characters.")
      .max(150, "Address line 1 must not exceed 150 characters."),
    addressLine2: z
      .string()
      .trim()
      .max(150, "Address line 2 must not exceed 150 characters.")
      .optional(),
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
  })
  .strip();

export const createOrderSchema = z
  .object({
    items: z
      .array(orderItemInputSchema)
      .min(1, "Your cart must contain at least 1 product item to checkout.")
      .max(25, "Maximum distinct line items exceeded (limit: 25)."),
    shippingAddress: shippingAddressSchema,
  })
  .strip(); // Server-authoritative checkout: client cannot submit totalAmount or prices

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
