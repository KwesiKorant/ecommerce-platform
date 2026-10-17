import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, UnauthorizedError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { loginSchema } from "@/lib/validations/auth";
import { createSessionToken, buildSessionCookie } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  // Gate 1: Sliding-window rate limit (auth: 5 req / 15 min)
  const rateLimit = checkRateLimit(req, "auth");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many login attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    // Gate 2: Strict Zod payload validation
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // Gate 3: Credential verification
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const passwordMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Create authenticated session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    // Gate 4: Return normalized response with HttpOnly session cookie
    const cookieHeader = buildSessionCookie(token);

    return jsonResponse(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
        message: "Signed in successfully.",
      },
      {
        status: 200,
        rateLimit,
        headers: { "Set-Cookie": cookieHeader },
      }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
