import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "ecom_session";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || "default_super_secret_development_key_min_32_bytes";
  return new TextEncoder().encode(secret);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Inject baseline security & financial cache protection headers on all responses
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Protect sensitive user portal routes
  const isOrdersRoute = pathname.startsWith("/orders");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isOrdersRoute || isAdminRoute) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecretKey());

      // Admin route strictly requires ADMIN role
      if (isAdminRoute && payload.role !== "ADMIN") {
        const forbiddenUrl = new URL("/?error=forbidden", request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    } catch {
      // Invalid or expired token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
