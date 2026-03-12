"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RiskScorePanelProps {
  patientId: string;
  encounterId?: string;
  onClose?: () => void;
}

type RiskLevel = "LOW" | "INTERMEDIATE" | "HIGH" | "CRITICAL";

interface RiskScore {
  id: string;
  name: string;
  value: number | string;
  interpretation: string;
  recommendation: string;
  level: RiskLevel;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LEVEL_CONFIG: Record<
  RiskLevel,
  { bg: string; border: string; text: string; badge: string }
> = {
  LOW: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
  },
  INTERMEDIATE: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  HIGH: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-800",
  },
  CRITICAL: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RiskScorePanel({
  patientId,
  encounterId,
  onClose,
}: RiskScorePanelProps) {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set(),
  );

  /* ---------- Fetch scores ---------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/cdss/risk-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ patientId, encounterId }),
        });

        if (!res.ok) throw new Error("Failed to compute risk scores");

        const json = await res.json();
        if (!cancelled) setScores(json.scores ?? json);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId, encounterId]);

  /* ---------- Acknowledge ----------------------------------------- */

  const handleAcknowledge = (scoreId: string) => {
    setAcknowledgedIds((prev) => new Set(prev).add(scoreId));
  };

  /* ---------- Render ---------------------------------------------- */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#0D1F3C] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#0A6E75]" />
            Risk Scores
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-73px)]">
          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#0A6E75]" />
                Computing risk scores...
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 p-4 space-y-2 animate-pulse"
                  >
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-8 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-3/4 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Score cards grid */}
          {!loading && !error && scores.length === 0 && (
            <p className="text-sm text-gray-500 py-4">
              No risk scores available for this patient.
            </p>
          )}

          {!loading && !error && scores.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scores.map((score) => {
                const config = LEVEL_CONFIG[score.level];
                const acknowledged = acknowledgedIds.has(score.id);

                return (
                  <div
                    key={score.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-3 transition-colors",
                      config.bg,
                      config.border,
                    )}
                  >
                    {/* Score name + level badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {score.name}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0",
                          config.badge,
                        )}
                      >
                        {score.level}
                      </span>
                    </div>

                    {/* Value */}
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        config.text,
                      )}
                    >
                      {score.value}
                    </p>

                    {/* Interpretation */}
                    <p className="text-sm text-gray-700">
                      {score.interpretation}
                    </p>

                    {/* Recommendation */}
                    <p className="text-sm text-gray-600 italic">
                      {score.recommendation}
                    </p>

                    {/* Acknowledge button */}
                    {acknowledged ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Acknowledged
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(score.id)}
                        className="h-7 text-xs"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
