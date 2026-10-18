import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError } from "@/lib/api-response";
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
    // Only verified Administrators can query audit records
    await requireAuth(req, Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType"); // "PRODUCT" | "ORDER"
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const where: { entityType?: string } = {};
    if (entityType && ["PRODUCT", "ORDER"].includes(entityType)) {
      where.entityType = entityType;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const parsedLogs = auditLogs.map((log) => {
      let parsedDetails: Record<string, unknown> = {};
      try {
        parsedDetails = JSON.parse(log.details);
      } catch {
        parsedDetails = { raw: log.details };
      }

      return {
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        details: parsedDetails,
        performedBy: log.performedBy,
        timestamp: log.timestamp,
      };
    });

    return jsonResponse(
      {
        success: true,
        data: { logs: parsedLogs, total: parsedLogs.length },
      },
      { status: 200, rateLimit }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
