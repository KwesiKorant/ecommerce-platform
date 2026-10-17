import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { buildClearSessionCookie } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "mutation");

  const clearCookieHeader = buildClearSessionCookie();

  return jsonResponse(
    {
      success: true,
      data: null,
      message: "Signed out successfully.",
    },
    {
      status: 200,
      rateLimit,
      headers: { "Set-Cookie": clearCookieHeader },
    }
  );
}
