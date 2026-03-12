"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileWarning,
  Eye,
  FileX,
  RefreshCw,
  Bell,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface UnsignedNote {
  id: string;
  doctorName: string;
  doctorUserId: string;
  patientName: string;
  patientId: string;
  encounterDate: string;
  createdAt: string;
  daysOverdue: number;
}

interface AccessAuditEntry {
  physicianId: string;
  physicianName: string;
  physicianRole: string;
  recordsAccessed: number;
  uniquePatients: number;
  anomalies: { patientId: string; patientName: string }[];
  flagged: boolean;
}

interface ConsentGap {
  patientId: string;
  patientName: string;
  patientEmail: string;
  completedAppointments: number;
  consentStatus: string;
}

// ── Page ───────────────────────────────────────────────────────────────

export default function ClinicalGovernancePage() {
  const [unsignedNotes, setUnsignedNotes] = useState<UnsignedNote[]>([]);
  const [accessAudit, setAccessAudit] = useState<AccessAuditEntry[]>([]);
  const [consentGaps, setConsentGaps] = useState<ConsentGap[]>([]);

  const [loadingUnsigned, setLoadingUnsigned] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingConsent, setLoadingConsent] = useState(true);

  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());

  // ── Fetch helpers ────────────────────────────────────────────────────

  const fetchUnsignedNotes = useCallback(async () => {
    setLoadingUnsigned(true);
    try {
      const res = await fetch("/api/admin/clinical/unsigned");
      const data = await res.json();
      if (data.success) setUnsignedNotes(data.unsignedNotes);
    } catch {
      /* handled by empty state */
    } finally {
      setLoadingUnsigned(false);
    }
  }, []);

  const fetchAccessAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch("/api/admin/clinical/access-audit");
      const data = await res.json();
      if (data.success) setAccessAudit(data.accessAudit);
    } catch {
      /* handled by empty state */
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  const fetchConsentGaps = useCallback(async () => {
    setLoadingConsent(true);
    try {
      const res = await fetch("/api/admin/clinical/consent-gaps");
      const data = await res.json();
      if (data.success) setConsentGaps(data.consentGaps);
    } catch {
      /* handled by empty state */
    } finally {
      setLoadingConsent(false);
    }
  }, []);

  useEffect(() => {
    fetchUnsignedNotes();
    fetchAccessAudit();
    fetchConsentGaps();
  }, [fetchUnsignedNotes, fetchAccessAudit, fetchConsentGaps]);

  // ── Send reminder ───────────────────────────────────────────────────

  const handleSendReminder = async (encounterId: string) => {
    setSendingReminder(encounterId);
    try {
      const res = await fetch(
        `/api/admin/clinical/unsigned/${encounterId}/remind`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        setReminderSent((prev) => new Set(prev).add(encounterId));
      }
    } catch {
      /* silent */
    } finally {
      setSendingReminder(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
      new Date(iso)
    );

  const isLoading = loadingUnsigned || loadingAudit || loadingConsent;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Clinical Governance">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0D1F3C]/10">
              <Shield className="h-6 w-6 text-[#0D1F3C]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0D1F3C]">
                Clinical Governance
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Oversight of clinical documentation, access controls, and
                patient consent
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => {
              fetchUnsignedNotes();
              fetchAccessAudit();
              fetchConsentGaps();
            }}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* ── Section 1: Unsigned Notes ─────────────────────────────── */}
        <section className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Unsigned Notes
            </h3>
            <span className="ml-auto text-sm text-gray-500">
              Draft encounters older than 48 hours
            </span>
          </div>

          {loadingUnsigned ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : unsignedNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No unsigned notes found. All clinical documentation is up to date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-6 py-3 font-medium">Doctor</th>
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">Encounter Date</th>
                    <th className="px-6 py-3 font-medium">Days Overdue</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {unsignedNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {note.doctorName}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {note.patientName}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(note.encounterDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            note.daysOverdue >= 7
                              ? "bg-red-100 text-red-700"
                              : note.daysOverdue >= 3
                                ? "bg-amber-100 text-amber-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {note.daysOverdue >= 7 && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {note.daysOverdue} day{note.daysOverdue !== 1 && "s"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {reminderSent.has(note.id) ? (
                          <span className="text-xs text-green-600 font-medium">
                            Reminder sent
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingReminder === note.id}
                            onClick={() => handleSendReminder(note.id)}
                          >
                            {sendingReminder === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Bell className="h-4 w-4 mr-1" />
                            )}
                            Send reminder
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 2: Access Audit ───────────────────────────────── */}
        <section className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#0A6E75]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Access Audit
            </h3>
            <span className="ml-auto text-sm text-gray-500">
              Record access in the last 7 days
            </span>
          </div>

          {loadingAudit ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : accessAudit.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No access logs recorded in the last 7 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-6 py-3 font-medium">Physician</th>
                    <th className="px-6 py-3 font-medium">Records Accessed</th>
                    <th className="px-6 py-3 font-medium">Unique Patients</th>
                    <th className="px-6 py-3 font-medium">
                      Flagged Anomalies
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accessAudit.map((entry) => (
                    <tr
                      key={entry.physicianId}
                      className={
                        entry.flagged
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {entry.physicianName}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {entry.recordsAccessed}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {entry.uniquePatients}
                      </td>
                      <td className="px-6 py-4">
                        {entry.flagged ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              {entry.anomalies.length} anomal
                              {entry.anomalies.length === 1 ? "y" : "ies"}
                            </span>
                            <ul className="mt-1 text-xs text-red-600 space-y-0.5">
                              {entry.anomalies.map((a) => (
                                <li key={a.patientId}>
                                  No appointment with {a.patientName}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 3: Consent Gaps ───────────────────────────────── */}
        <section className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <FileX className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Consent Gaps
            </h3>
            <span className="ml-auto text-sm text-gray-500">
              Completed telemedicine visits without consent on file
            </span>
          </div>

          {loadingConsent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : consentGaps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              All patients with completed appointments have telemedicine consent
              on file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-600">
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">
                      Completed Appointments
                    </th>
                    <th className="px-6 py-3 font-medium">Consent Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {consentGaps.map((gap) => (
                    <tr key={gap.patientId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {gap.patientName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {gap.patientEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {gap.completedAppointments}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <FileX className="h-3 w-3" />
                          {gap.consentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
