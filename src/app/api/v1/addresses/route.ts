import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";
import { addressInputSchema } from "@/lib/validations/address";

/**
 * GET /api/v1/addresses
 * Retrieves all saved shipping addresses for the authenticated customer.
 * Strict customer isolation (anti-IDOR) guaranteed via session.userId filter.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    // Lean index scan on [userId, isDefault]
    const addresses = await prisma.address.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        addressLine1: true,
        city: true,
        postalCode: true,
        country: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return jsonResponse({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/v1/addresses
 * Creates a new saved shipping address for the authenticated customer.
 * If marked as default (or if it's the customer's first address), atomically sets
 * other existing addresses for this user to isDefault = false.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const validatedData = addressInputSchema.parse(body);

    const existingCount = await prisma.address.count({
      where: { userId: session.userId },
    });

    // If first address or explicitly flagged as default, enforce default status
    const shouldBeDefault = validatedData.isDefault || existingCount === 0;

    const newAddress = await prisma.$transaction(async (tx) => {
      if (shouldBeDefault && existingCount > 0) {
        await tx.address.updateMany({
          where: { userId: session.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.address.create({
        data: {
          userId: session.userId,
          fullName: validatedData.fullName,
          addressLine1: validatedData.addressLine1,
          city: validatedData.city,
          postalCode: validatedData.postalCode,
          country: validatedData.country,
          isDefault: shouldBeDefault,
        },
        select: {
          id: true,
          fullName: true,
          addressLine1: true,
          city: true,
          postalCode: true,
          country: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return jsonResponse(
      {
        success: true,
        data: newAddress,
        message: "Shipping address saved successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
