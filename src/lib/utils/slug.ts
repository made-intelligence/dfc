/**
 * Generate a URL-friendly slug from a name
 * @param name - The name to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique doctor slug with "dr-" prefix
 * @param name - The doctor's name
 * @param suffix - Optional suffix to make slug unique (e.g., a number)
 * @returns A unique doctor slug
 */
// export function generateDoctorSlug(
//   name: string,
//   suffix?: string | number,
// ): string {
//   // Remove any leading "Dr", "Dr.", or even existing "dr-" slugs.
//   const cleaned = name
//     .replace(/^dr\.?\s*/i, "") // Remove "Dr", "Dr.", "Dr "
//     .replace(/^dr-/i, ""); // Remove existing "dr-" slug prefix

//   const baseSlug = generateSlug(cleaned);

//   // Always apply exactly one dr- prefix
//   let slug = `dr-${baseSlug}`;

//   if (suffix) {
//     slug += `-${suffix}`;
//   }

//   return slug;
// }

export function generateDoctorSlug(
  name: string,
  suffix?: string | number,
): string {
  const lower = name.toLowerCase().trim();

  const professorRegex =
    /\b(professor\s*emeritus|emeritus\s*prof|associate\s*prof|assoc\.?\s*prof|assistant\s*prof|asst\.?\s*prof|hon\.?\s*prof|visiting\s*prof|professor|prof)\b/;

  // Doctor-level titles
  const doctorRegex = /\b(dr)\.?\b/;

  let prefix = "dr-"; 

  if (professorRegex.test(lower)) {
    prefix = "prof-";
  } else if (doctorRegex.test(lower)) {
    prefix = "dr-";
  }

  const removeAllTitlesRegex =
    /\b(professor\s*emeritus|emeritus\s*prof|associate\s*prof|assoc\.?\s*prof|assistant\s*prof|asst\.?\s*prof|hon\.?\s*prof|visiting\s*prof|professor|prof|dr)\.?\s*/gi;

  const cleaned = name
    .replace(removeAllTitlesRegex, "")
    .replace(/^(prof-|dr-)/i, "")
    .trim();

  const baseSlug = generateSlug(cleaned);
  let slug = `${prefix}${baseSlug}`;

  if (suffix) slug += `-${suffix}`;

  return slug;
}

