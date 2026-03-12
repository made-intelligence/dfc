"use client";

import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SOAPQualityModalProps {
  gaps: string[];
  warnings: string[];
  suggestions: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SOAPQualityModal({
  gaps,
  warnings,
  suggestions,
  onConfirm,
  onCancel,
}: SOAPQualityModalProps) {
  const hasGaps = gaps.length > 0;
  const hasWarnings = warnings.length > 0;
  const allClear = !hasGaps && !hasWarnings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#0D1F3C]">
            SOAP Note Quality Check
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ---- GAPS (blocking) ---- */}
          {hasGaps && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <h3 className="text-sm font-bold text-red-800">
                  Cannot sign &mdash; please address these gaps:
                </h3>
              </div>
              <ul className="space-y-1.5 pl-7">
                {gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="text-sm text-red-700 list-disc"
                  >
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ---- WARNINGS (non-blocking) ---- */}
          {!hasGaps && hasWarnings && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <h3 className="text-sm font-bold text-amber-800">
                  Warnings found &mdash; review before signing:
                </h3>
              </div>
              <ul className="space-y-1.5 pl-7">
                {warnings.map((warning, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-700 list-disc"
                  >
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ---- ALL CLEAR ---- */}
          {allClear && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <h3 className="text-sm font-bold text-green-800">
                  Note looks complete
                </h3>
              </div>
            </div>
          )}

          {/* ---- Suggestions (always shown when present) ---- */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suggestions
              </p>
              <ul className="space-y-1 pl-4">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-600 list-disc"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer / actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {hasGaps && (
            <Button onClick={onCancel}>Go back</Button>
          )}

          {!hasGaps && hasWarnings && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Go back
              </Button>
              <Button
                onClick={onConfirm}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sign anyway
              </Button>
            </>
          )}

          {allClear && (
            <Button
              onClick={onConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Sign and close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
