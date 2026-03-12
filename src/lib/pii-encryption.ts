import { encrypt, decrypt, isEncrypted } from "./encryption";

/**
 * PII field-level encryption configuration.
 * Maps model names to the fields that should be encrypted at rest.
 *
 * This is applied as a Prisma middleware layer in prisma.ts.
 * Fields are encrypted before write and decrypted after read, transparently.
 */
export const PII_FIELDS: Record<string, string[]> = {
  PatientProfile: [
    "address",
    "emergencyContact",
    "nhisNumber",
    "nextOfKinPhone",
  ],
  User: [
    "phone",
  ],
};

/**
 * Encrypt PII fields before writing to database.
 */
export function encryptPiiFields(
  model: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const fields = PII_FIELDS[model];
  if (!fields || !data) return data;

  const result = { ...data };
  for (const field of fields) {
    if (typeof result[field] === "string" && result[field] && !isEncrypted(result[field] as string)) {
      result[field] = encrypt(result[field] as string);
    }
  }
  return result;
}

/**
 * Decrypt PII fields after reading from database.
 */
export function decryptPiiFields(
  model: string,
  data: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data) return data;

  const fields = PII_FIELDS[model];
  if (!fields) return data;

  const result = { ...data };
  for (const field of fields) {
    if (typeof result[field] === "string" && result[field] && isEncrypted(result[field] as string)) {
      result[field] = decrypt(result[field] as string);
    }
  }
  return result;
}

/**
 * Recursively decrypt PII in nested include results.
 * Handles the common pattern of { user: { phone: "encrypted" }, patientProfile: { address: "encrypted" } }
 */
export function decryptNestedPii(data: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!data) return data;

  const result = { ...data };

  // Decrypt top-level fields for each known model
  for (const [model, fields] of Object.entries(PII_FIELDS)) {
    // Check if this object itself has PII fields (e.g., User with phone)
    for (const field of fields) {
      if (typeof result[field] === "string" && isEncrypted(result[field] as string)) {
        result[field] = decrypt(result[field] as string);
      }
    }

    // Check nested relations (e.g., user.patientProfile.address)
    const relationKey = model.charAt(0).toLowerCase() + model.slice(1);
    if (result[relationKey] && typeof result[relationKey] === "object") {
      result[relationKey] = decryptPiiFields(model, result[relationKey] as Record<string, unknown>);
    }
  }

  return result;
}
