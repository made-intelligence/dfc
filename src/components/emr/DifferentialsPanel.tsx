"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DifferentialsPanelProps {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  encounterId?: string;
  onClose: () => void;
}

type Probability = "HIGH" | "MODERATE" | "LOW";

interface Investigation {
  name: string;
  rationale?: string;
}

interface Differential {
  diagnosis: string;
  probability: Probability;
  supportingFeatures: string[];
  againstFeatures?: string[];
  keyInvestigations: Investigation[];
}

interface DifferentialsResponse {
  differentials: Differential[];
  redFlags: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PROBABILITY_CONFIG: Record<
  Probability,
  { bg: string; text: string; label: string }
> = {
  HIGH: { bg: "bg-red-100", text: "text-red-700", label: "High" },
  MODERATE: { bg: "bg-amber-100", text: "text-amber-700", label: "Moderate" },
  LOW: { bg: "bg-blue-100", text: "text-blue-700", label: "Low" },
};

const DISCLAIMER =
  "These differential diagnoses are AI-generated suggestions for physician consideration only. They do not constitute a diagnosis and must be independently verified through clinical assessment and appropriate investigations.";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DifferentialsPanel({
  patientId,
  chiefComplaint,
  symptoms,
  encounterId,
  onClose,
}: DifferentialsPanelProps) {
  const [data, setData] = useState<DifferentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderingInvestigation, setOrderingInvestigation] = useState<string | null>(
    null,
  );

  /* ---------- Fetch differentials ---------------------------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/cdss/differentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            encounterId,
            chiefComplaint,
            symptoms,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch differentials");
        }

        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "An error occurred",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId, encounterId, chiefComplaint, symptoms]);

  /* ---------- Order investigation ---------------------------------- */

  const handleOrderInvestigation = async (investigation: Investigation) => {
    setOrderingInvestigation(investigation.name);
    try {
      await fetch("/api/emr/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId,
          encounterId,
          name: investigation.name,
          rationale: investigation.rationale,
        }),
      });
    } catch {
      /* non-blocking */
    } finally {
      setOrderingInvestigation(null);
    }
  };

  /* ---------- Render ---------------------------------------------- */

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative z-10 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-[#0D1F3C]">
            Differential Diagnoses &mdash; For physician consideration
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#0A6E75]" />
                Analysing clinical picture...
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-100 p-4 space-y-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-20 rounded-full bg-gray-200" />
                    <div className="h-5 w-48 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="mt-3"
              >
                Close
              </Button>
            </div>
          )}

          {/* Results */}
          {data && !loading && (
            <>
              {/* Differentials list */}
              <div className="space-y-4">
                {data.differentials.map((diff, idx) => {
                  const prob = PROBABILITY_CONFIG[diff.probability];

                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 bg-white p-4 space-y-3 hover:shadow-sm transition-shadow"
                    >
                      {/* Title + probability */}
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "text-xs font-semibold border-0",
                            prob.bg,
                            prob.text,
                          )}
                        >
                          {prob.label}
                        </Badge>
                        <h3 className="text-base font-bold text-gray-900">
                          {diff.diagnosis}
                        </h3>
                      </div>

                      {/* Supporting features */}
                      {diff.supportingFeatures.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Supporting features
                          </p>
                          <ul className="space-y-0.5">
                            {diff.supportingFeatures.map((f, fi) => (
                              <li
                                key={fi}
                                className="text-sm text-gray-700 flex items-start gap-1.5"
                              >
                                <span className="text-green-500 mt-1 shrink-0">
                                  +
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Against features */}
                      {diff.againstFeatures && diff.againstFeatures.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Against
                          </p>
                          <ul className="space-y-0.5">
                            {diff.againstFeatures.map((f, fi) => (
                              <li
                                key={fi}
                                className="text-sm text-gray-700 flex items-start gap-1.5"
                              >
                                <span className="text-red-400 mt-1 shrink-0">
                                  &minus;
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Key investigations */}
                      {diff.keyInvestigations.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            Key investigations
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {diff.keyInvestigations.map((inv, ii) => (
                              <Button
                                key={ii}
                                size="sm"
                                variant="outline"
                                disabled={
                                  orderingInvestigation === inv.name
                                }
                                onClick={() =>
                                  handleOrderInvestigation(inv)
                                }
                                className="h-7 text-xs gap-1.5"
                              >
                                {orderingInvestigation === inv.name ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <FlaskConical className="h-3 w-3" />
                                )}
                                Order: {inv.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Red flags */}
              {data.redFlags && data.redFlags.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags
                  </h3>
                  <ul className="space-y-1">
                    {data.redFlags.map((flag, fi) => (
                      <li
                        key={fi}
                        className="text-sm text-red-700 flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 leading-snug border-t border-gray-100 pt-4">
                {DISCLAIMER}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
