import { randomBytes } from "crypto";

/**
 * Opaque, DB-backed account-claim tokens.
 *
 * Admin-created members (e.g. the founding batch imported by the secretariat)
 * are created without a password. They receive a claim link carrying one of
 * these tokens and set their own password to activate login. Validation is a
 * straight DB lookup on `User.claimToken`, so tokens do not depend on any
 * shared signing secret between the importer script and the deployed app.
 */

/** How long a claim link stays valid, in days. */
export const CLAIM_TOKEN_TTL_DAYS = 30;

/** Generate a URL-safe, unguessable claim token (256 bits of entropy). */
export function generateClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Expiry timestamp for a freshly minted claim token. */
export function claimTokenExpiry(days: number = CLAIM_TOKEN_TTL_DAYS): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Build the full claim URL a member clicks to set their password. */
export function buildClaimUrl(baseUrl: string, token: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/auth/claim?token=${encodeURIComponent(token)}`;
}
