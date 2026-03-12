"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  BookOpen,
  Calculator,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DifferentialsPanel from "@/components/emr/DifferentialsPanel";
import RiskScorePanel from "@/components/emr/RiskScorePanel";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AlertLevel = "CRITICAL" | "WARNING" | "INFO";

interface CDSSAlert {
  id: string;
  level: AlertLevel;
  title: string;
  body: string;
  suggestion?: string;
  createdAt: string;
}

interface CDSSPanelProps {
  patientId: string;
  encounterId?: string;
  diagnosisText?: string;
  newDrugAdded?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LEVEL_CONFIG: Record<
  AlertLevel,
  { border: string; icon: typeof AlertTriangle; pulse: boolean; iconColor: string }
> = {
  CRITICAL: {
    border: "border-l-red-600",
    icon: AlertTriangle,
    pulse: true,
    iconColor: "text-red-600",
  },
  WARNING: {
    border: "border-l-amber-500",
    icon: AlertCircle,
    pulse: false,
    iconColor: "text-amber-500",
  },
  INFO: {
    border: "border-l-blue-500",
    icon: Info,
    pulse: false,
    iconColor: "text-blue-500",
  },
};

const DISCLAIMER =
  "This clinical decision support tool is for informational purposes only and does not replace professional medical judgement. All suggestions must be independently verified by the treating physician.";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CDSSPanel({
  patientId,
  encounterId,
  diagnosisText,
  newDrugAdded,
}: CDSSPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [alerts, setAlerts] = useState<CDSSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const diagnosisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Fetch alerts ---------------------------------------- */

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ patientId, status: "ACTIVE" });
      if (encounterId) params.set("encounterId", encounterId);

      const res = await fetch(`/api/cdss/alerts?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const fetched: CDSSAlert[] = data.alerts ?? data;
      setAlerts(fetched);

      // Auto-open when critical / warning alerts exist
      const hasCriticalOrWarning = fetched.some(
        (a) => a.level === "CRITICAL" || a.level === "WARNING",
      );
      if (hasCriticalOrWarning) setCollapsed(false);
    } catch {
      // Silently fail — CDSS is supplementary
    }
  }, [patientId, encounterId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  /* ---------- Diagnosis watcher (2 s debounce) -------------------- */

  useEffect(() => {
    if (!diagnosisText?.trim()) return;

    if (diagnosisTimer.current) clearTimeout(diagnosisTimer.current);

    diagnosisTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/cdss/guidelines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ patientId, encounterId, diagnosisText }),
        });
        fetchAlerts();
      } catch {
        /* non-blocking */
      }
    }, 2000);

    return () => {
      if (diagnosisTimer.current) clearTimeout(diagnosisTimer.current);
    };
  }, [diagnosisText, patientId, encounterId, fetchAlerts]);

  /* ---------- Drug watcher (immediate) ----------------------------- */

  useEffect(() => {
    if (!newDrugAdded?.trim()) return;

    (async () => {
      try {
        setLoading(true);
        await fetch("/api/cdss/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            encounterId,
            checkType: "DRUG",
            drug: newDrugAdded,
          }),
        });
        await fetchAlerts();
      } catch {
        /* non-blocking */
      } finally {
        setLoading(false);
      }
    })();
  }, [newDrugAdded, patientId, encounterId, fetchAlerts]);

  /* ---------- Alert actions ---------------------------------------- */

  const handleAcknowledge = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      await fetch("/api/cdss/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ alertId, action: "ACKNOWLEDGED" }),
      });
      await fetchAlerts();
    } catch {
      /* non-blocking */
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      await fetch("/api/cdss/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          alertId,
          action: "DISMISSED",
          notes: dismissReason,
        }),
      });
      setDismissingId(null);
      setDismissReason("");
      await fetchAlerts();
    } catch {
      /* non-blocking */
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Action buttons --------------------------------------- */

  const [diffOpen, setDiffOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);

  const handleGetDifferentials = () => setDiffOpen(true);
  const handleCheckGuidelines = async () => {
    setLoading(true);
    try {
      await fetch("/api/cdss/guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ patientId, encounterId, diagnosisText }),
      });
      await fetchAlerts();
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  };
  const handleRiskScores = () => setRiskOpen(true);

  /* ---------- Render ---------------------------------------------- */

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between px-4 py-3 bg-[#0D1F3C] text-white hover:bg-[#0D1F3C]/90 transition-colors"
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-5 w-5" />
            Clinical Decision Support
            {alerts.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {alerts.length}
              </span>
            )}
          </span>
          {collapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>

        {!collapsed && (
          <div className="p-4 space-y-4">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleGetDifferentials}
                className="gap-1.5"
              >
                <Activity className="h-4 w-4" />
                Get Differentials
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCheckGuidelines}
                disabled={loading}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                Check Guidelines
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRiskScores}
                className="gap-1.5"
              >
                <Calculator className="h-4 w-4" />
                Risk Scores
              </Button>
            </div>

            {/* Alerts list */}
            {alerts.length === 0 && !loading && (
              <p className="text-sm text-gray-500 py-2">
                No active alerts for this encounter.
              </p>
            )}

            {loading && alerts.length === 0 && (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            )}

            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = LEVEL_CONFIG[alert.level];
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-lg border-l-4 bg-gray-50 p-3 space-y-2",
                      config.border,
                      config.pulse && "animate-pulse",
                    )}
                  >
                    {/* Title row */}
                    <div className="flex items-start gap-2">
                      <Icon
                        className={cn("h-5 w-5 mt-0.5 shrink-0", config.iconColor)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {alert.title}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">
                          {alert.body}
                        </p>
                        {alert.suggestion && (
                          <p className="text-sm italic text-gray-600 mt-1">
                            {alert.suggestion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-7">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="h-7 text-xs"
                      >
                        {actionLoading === alert.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Acknowledge"
                        )}
                      </Button>

                      {dismissingId === alert.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            placeholder="Reason for dismissal..."
                            value={dismissReason}
                            onChange={(e) => setDismissReason(e.target.value)}
                            className="flex-1 h-7 rounded-md border border-gray-300 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/50"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === alert.id}
                            onClick={() => handleDismiss(alert.id)}
                            className="h-7 text-xs"
                          >
                            {actionLoading === alert.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setDismissingId(null);
                              setDismissReason("");
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDismissingId(alert.id)}
                          className="h-7 text-xs text-gray-500"
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 leading-snug border-t border-gray-100 pt-3">
              {DISCLAIMER}
            </p>
          </div>
        )}
      </div>

      {/* Child modals */}
      {diffOpen && (
        <DifferentialsPanel
          patientId={patientId}
          encounterId={encounterId}
          chiefComplaint=""
          symptoms={[]}
          onClose={() => setDiffOpen(false)}
        />
      )}
      {riskOpen && (
        <RiskScorePanel
          patientId={patientId}
          encounterId={encounterId}
          onClose={() => setRiskOpen(false)}
        />
      )}
    </>
  );
}

