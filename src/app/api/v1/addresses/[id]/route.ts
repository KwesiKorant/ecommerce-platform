import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, NotFoundError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth-check";
import { updateAddressSchema } from "@/lib/validations/address";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/v1/addresses/:id
 * Updates an existing address or designates it as the default.
 * Enforces strict customer ownership verification (Anti-IDOR).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    // Verify address exists and belongs strictly to authenticated user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError("Address not found.");
    }

    const body = await req.json();
    const validatedData = updateAddressSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      // If promoting this address to default, unset other defaults
      if (validatedData.isDefault === true && !existingAddress.isDefault) {
        await tx.address.updateMany({
          where: { userId: session.userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.address.update({
        where: { id },
        data: validatedData,
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

    return jsonResponse({
      success: true,
      data: updated,
      message: "Address updated successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/v1/addresses/:id
 * Deletes a saved address.
 * Anti-IDOR enforcement: verifies user ownership.
 * If default address is deleted, seamlessly promotes the most recent remaining address.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingAddress) {
      throw new NotFoundError("Address not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      // If deleted address was default, promote newest remaining address
      if (existingAddress.isDefault) {
        const nextDefault = await tx.address.findFirst({
          where: { userId: session.userId },
          orderBy: { createdAt: "desc" },
        });

        if (nextDefault) {
          await tx.address.update({
            where: { id: nextDefault.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return jsonResponse({
      success: true,
      message: "Address removed successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
