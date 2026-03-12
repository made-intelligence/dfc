"use client";

import { AlertTriangle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Allergy {
  allergen: string;
  severity: string;
}

interface AllergyBannerProps {
  allergies: Allergy[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AllergyBanner({ allergies }: AllergyBannerProps) {
  const severe = allergies.filter(
    (a) => a.severity === "LIFE_THREATENING" || a.severity === "SEVERE",
  );

  if (severe.length === 0) return null;

  const allergens = severe.map((a) => a.allergen).join(", ");

  return (
    <div
      className="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold
                 flex items-center gap-2 animate-pulse"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      ALLERGY ALERT: {allergens}
    </div>
  );
}
