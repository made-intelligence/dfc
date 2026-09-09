/**
 * Shared cookie attributes.
 *
 * Every auth cookie is `Secure`, which browsers only accept over HTTPS (with
 * localhost exempted). That silently drops the cookie when the dev server is
 * reached over a LAN IP from a phone: login returns 200 and the session never
 * sticks. Production is always HTTPS, so we keep `Secure` there and drop it
 * only in development.
 */
export const SECURE_ATTR = process.env.NODE_ENV === "production" ? "Secure; " : "";
