import { NextResponse } from "next/server";

/**
 * Field length limits for medical text fields.
 * Prevents DoS via unbounded text storage.
 */
export const MAX_LENGTHS = {
  shortText: 255,        // names, titles, codes
  mediumText: 2000,      // descriptions, notes, symptoms
  longText: 10000,       // diagnosis, treatment plans, SOAP notes
  veryLongText: 50000,   // full clinical summaries, exports
  searchQuery: 200,      // search input
  phone: 20,
  email: 254,
} as const;

/**
 * Validate and truncate a string field to max length.
 * Returns the trimmed string or null if empty.
 */
export function sanitizeText(
  value: unknown,
  maxLength: number = MAX_LENGTHS.mediumText
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/**
 * Validate required fields exist and are within length limits.
 * Returns a 400 NextResponse if validation fails, or null if valid.
 */
/**
 * Validate a phone number server-side.
 * Accepts international format (+234..., +44..., +1...) and local Nigerian (080..., 090..., 070..., 081...).
 * Returns the cleaned phone number or null if invalid.
 */
export function validatePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  // Strip spaces, dashes, dots, parens
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;
  // International: +{1-3 digits}{6-14 digits}
  if (/^\+\d{1,3}\d{6,14}$/.test(cleaned)) return cleaned;
  // Nigerian local: 0{7-9|8}{0-9}{8 digits}
  if (/^0[7-9]\d{9}$/.test(cleaned)) return cleaned;
  return null;
}

export function validateFields(
  body: Record<string, unknown>,
  rules: Record<string, { required?: boolean; maxLength?: number; type?: "string" | "number" | "boolean" }>
): NextResponse | null {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];

    if (rule.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    if (rule.type === "string" && typeof value !== "string") {
      errors.push(`${field} must be a string`);
      continue;
    }

    if (rule.type === "number" && typeof value !== "number") {
      errors.push(`${field} must be a number`);
      continue;
    }

    if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
      errors.push(`${field} exceeds maximum length of ${rule.maxLength} characters`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return null;
}
