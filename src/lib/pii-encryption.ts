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

/** Every field name that is encrypted at rest, on any model. */
const ALL_PII_FIELDS = new Set(Object.values(PII_FIELDS).flat());

/**
 * Decrypt PII anywhere in a query result, however deeply it is nested.
 *
 * The per-model helpers above only see the model actually being queried, so a
 * findFirst on DFCMember that includes { user: { phone } } came back with
 * ciphertext and rendered it to the admin as "fda54cf...:683196e...:...".
 * Any parent model that is not itself in PII_FIELDS had the same problem, and
 * more than twenty routes nest one.
 *
 * Keyed on the field name and guarded by isEncrypted, so a value that is
 * already plaintext, or a field that merely shares a name on some unrelated
 * model, is left exactly as it is. Class instances are not walked: Date and
 * Decimal have no PII inside them and copying them would change their type.
 */
export function decryptDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decryptDeep);
  if (value === null || typeof value !== "object") return value;

  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value;

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && ALL_PII_FIELDS.has(key) && isEncrypted(item)) {
      out[key] = decrypt(item);
    } else {
      out[key] = decryptDeep(item);
    }
  }
  return out;
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
