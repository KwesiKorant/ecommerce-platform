export type RateLimitActionType = "read" | "mutation" | "checkout" | "auth" | "admin";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Global in-memory sliding-window bucket store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection to eliminate stale IPs and memory leaks
if (typeof setInterval !== "undefined") {
  const gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref timer in Node environment so background processes do not hang test runs
  if (gcTimer && typeof gcTimer === "object" && "unref" in gcTimer) {
    (gcTimer as NodeJS.Timeout).unref();
  }
}

/**
 * Enforces sliding-window IP rate limiting per endpoint category.
 *
 * Quotas (per IP):
 * - read: 60 req / min
 * - mutation: 20 req / min
 * - checkout: 10 req / min (prevents bot inventory locking / hoarding)
 * - admin: 20 req / min
 * - auth: 5 req / 15 min (brute force protection)
 */
export function checkRateLimit(
  req: Request,
  type: RateLimitActionType = "read"
): RateLimitResult {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  let limit: number;
  let windowMs: number;

  switch (type) {
    case "checkout":
      limit = 10;
      windowMs = 60 * 1000; // 10 per minute
      break;
    case "auth":
      limit = 5;
      windowMs = 15 * 60 * 1000; // 5 per 15 minutes
      break;
    case "admin":
    case "mutation":
      limit = 20;
      windowMs = 60 * 1000; // 20 per minute
      break;
    case "read":
    default:
      limit = 60;
      windowMs = 60 * 1000; // 60 per minute
      break;
  }

  const key = `${ip}:${type}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: resetTime,
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: record.resetTime,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetAt: record.resetTime,
  };
}

/**
 * Resets the in-memory rate limit store. Useful for automated integration tests.
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
