/**
 * Tidy a person's name for display.
 *
 * Member records came from several imports and are inconsistently cased:
 * "FOLAKE J KOFO-IDOWU", "mr onyekwelu nzewi", "Dr. Nwokwu patricia". Shown
 * side by side in a directory of consultants, that reads as careless.
 *
 * Corrections are made word by word, and only to words carrying no capital
 * of their own. Any word with internal capitalisation is left exactly as the
 * member typed it, so "McGregor" and "O'Brien" survive untouched while
 * "FOLAKE J KOFO-IDOWU" and "Dr. Nwokwu patricia" are tidied.
 */

const HONORIFICS: Record<string, string> = {
  dr: "Dr.",
  "dr.": "Dr.",
  prof: "Prof.",
  "prof.": "Prof.",
  mr: "Mr",
  mrs: "Mrs",
  ms: "Ms",
  miss: "Miss",
};

/** Capitalise a run of letters, respecting internal hyphens and apostrophes. */
function capitalizeWord(word: string): string {
  return word.replace(/[^\s]+/g, (segment) =>
    segment
      .split(/([-'’])/)
      .map((part) =>
        /[-'’]/.test(part)
          ? part
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
      )
      .join(""),
  );
}

export function formatDisplayName(name?: string | null): string {
  const trimmed = (name || "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  return trimmed
    .split(" ")
    .map((word) => {
      const honorific = HONORIFICS[word.toLowerCase()];
      if (honorific) return honorific;
      // A lone initial stays a capital letter: "J" or "J.".
      if (/^[a-z]\.?$/i.test(word)) return word.toUpperCase();
      // Shouting ("KOFO-IDOWU") or no capital at all ("patricia") gets fixed.
      // Anything else is a deliberate capital, so leave it.
      const isShouting = word === word.toUpperCase();
      const hasNoCapital = !/[A-Z]/.test(word);
      return isShouting || hasNoCapital ? capitalizeWord(word) : word;
    })
    .join(" ");
}
