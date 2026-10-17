import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonResponse, handleApiError, ConflictError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { registerSchema } from "@/lib/validations/auth";
import { createSessionToken, buildSessionCookie } from "@/lib/auth-check";

export async function POST(req: NextRequest) {
  // Gate 1: Sliding-window rate limit (auth: 5 req / 15 min)
  const rateLimit = checkRateLimit(req, "auth");
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Too many authentication attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429, rateLimit }
    );
  }

  try {
    // Gate 2: Strict Zod payload validation
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Gate 3: Check for existing account
    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // Hash password securely with bcrypt
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // Create authenticated session
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
        data: { user },
        message: "Account registered successfully.",
      },
      {
        status: 201,
        rateLimit,
        headers: { "Set-Cookie": cookieHeader },
      }
    );
  } catch (error) {
    return handleApiError(error, rateLimit);
  }
}
