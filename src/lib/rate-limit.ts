import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const PRESETS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },     // 5 per 15 min
  payment: { maxRequests: 10, windowMs: 60 * 1000 },       // 10 per minute
  upload: { maxRequests: 10, windowMs: 60 * 1000 },        // 10 per minute
  api: { maxRequests: 60, windowMs: 60 * 1000 },           // 60 per minute
};

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(preset: keyof typeof PRESETS = "api") {
  const config = PRESETS[preset];

  return async function check(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const ip = getClientIP(request);
    const key = `${preset}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return null;
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

export const authRateLimit = rateLimit("auth");
export const paymentRateLimit = rateLimit("payment");
export const uploadRateLimit = rateLimit("upload");
export const apiRateLimit = rateLimit("api");
