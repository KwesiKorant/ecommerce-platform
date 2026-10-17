import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, NotFoundError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { requireAuth } from "@/lib/auth-check";

export async function GET(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "read");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    const session = await requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User account not found.");
    }

    return jsonResponse(
      {
        success: true,
        data: { user },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
