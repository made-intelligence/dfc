/**
 * The site's own public base URL.
 *
 * Reads APP_URL first so the value can live as a plain, unprefixed environment
 * variable. Every consumer of this is server-side (route handlers, metadata,
 * sitemap), so the NEXT_PUBLIC_ prefix was never needed and only made the
 * value look like a secret being leaked to the browser. NEXT_PUBLIC_APP_URL is
 * still honoured so a deployment set up under the old name keeps working.
 *
 * The last-resort fallback is the production domain rather than localhost.
 * Several callers build Paystack callback URLs and email links from this, and
 * a localhost fallback in production silently breaks payments and dead-links
 * every invite instead of failing loudly.
 */
export function appUrl(): string {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const fallback =
    process.env.NODE_ENV === "production"
      ? "https://www.dfcare.org"
      : "http://localhost:3000";

  return (configured || fallback).replace(/\/+$/, "");
}
