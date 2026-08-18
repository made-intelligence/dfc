import crypto from "crypto";

/**
 * Constant-time string comparison for secrets (cron secrets, API keys, tokens).
 * Prevents timing side-channels that a plain `===` / `!==` can leak. Returns
 * false for any length mismatch without short-circuiting on content.
 */
export function secureEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
