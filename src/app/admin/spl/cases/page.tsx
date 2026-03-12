"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Loader2,
  Briefcase,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  FileText,
  DollarSign,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SPLCaseStatus =
  | "SUBMITTED"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "REPORT_READY"
  | "DELIVERED"
  | "BILLED"
  | "PAID"
  | "CANCELLED";

interface SPLCase {
  id: string;
  referenceNumber: string;
  partnerId: string;
  contractId: string;
  serviceType: string;
  status: SPLCaseStatus;
  patientRef: string;
  patientName: string;
  specialty: string;
  diagnosis: string;
  clinicalSummary: string | null;
  documentUrls: string[] | null;
  triageNotes: string | null;
  assignedToId: string | null;
  aiBrief: string | null;
  reportText: string | null;
  coordinatorNotes: string | null;
  deliveredAt: string | null;
  agreedFee: string | null;
  dfcPlatformFee: string | null;
  specialistFee: string | null;
  submittedAt: string;
  partner: { name: string; shortName: string };
  contract: { title: string };
}

interface DFCMember {
  id: string;
  name: string;
  email: string;
  doctorProfile?: { specialty?: { name: string } } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  TRIAGED: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-indigo-100 text-indigo-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  REPORT_READY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  BILLED: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const TABS = [
  { label: "New", statuses: ["SUBMITTED"] },
  { label: "In Progress", statuses: ["TRIAGED", "ASSIGNED", "IN_REVIEW"] },
  { label: "Ready", statuses: ["REPORT_READY"] },
  { label: "Delivered", statuses: ["DELIVERED"] },
  { label: "Billed", statuses: ["BILLED", "PAID"] },
];

function formatStatus(s: string) {
  return s.replace(/_/g, " ");
}

function formatCurrency(val: string | number | null) {
  if (val === null || val === undefined) return "--";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(val));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SPLCasesPage() {
  const [cases, setCases] = useState<SPLCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCase, setSelectedCase] = useState<SPLCase | null>(null);

  // Assignment
  const [members, setMembers] = useState<DFCMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Coordinator notes
  const [coordNotes, setCoordNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Deliver
  const [delivering, setDelivering] = useState(false);

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/spl/cases", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases);
      }
    } catch {
      console.error("Failed to fetch SPL cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Fetch DFC members for assignment
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/admin/users?role=DFC_MEMBER", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data.users || []);
        }
      } catch {
        console.error("Failed to fetch members");
      }
    };
    fetchMembers();
  }, []);

  // Filtered cases by active tab
  const filteredCases = cases.filter((c) =>
    TABS[activeTab].statuses.includes(c.status)
  );

  // Select a case
  const handleSelectCase = (c: SPLCase) => {
    setSelectedCase(c);
    setCoordNotes(c.coordinatorNotes || "");
    setSelectedMemberId(c.assignedToId || "");
  };

  // Assign specialist
  const handleAssign = async () => {
    if (!selectedCase || !selectedMemberId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/spl/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignedToId: selectedMemberId,
          status: "ASSIGNED",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.case);
        await fetchCases();
      }
    } catch {
      console.error("Failed to assign specialist");
    } finally {
      setAssigning(false);
    }
  };

  // Save coordinator notes
  const handleSaveNotes = async () => {
    if (!selectedCase) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/spl/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coordinatorNotes: coordNotes }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.case);
      }
    } catch {
      console.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  // Mark as delivered
  const handleDeliver = async () => {
    if (!selectedCase) return;
    setDelivering(true);
    try {
      const res = await fetch(`/api/admin/spl/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.case);
        await fetchCases();
      }
    } catch {
      console.error("Failed to deliver case");
    } finally {
      setDelivering(false);
    }
  };

  return (
    <DashboardLayout title="SPL Cases">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            SPL Case Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View, triage, assign, and track all specialist partner cases.
          </p>
        </div>

        {/* Two-panel layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left panel — Case queue */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {TABS.map((tab, idx) => {
                const active = activeTab === idx;
                const count = cases.filter((c) =>
                  tab.statuses.includes(c.status)
                ).length;
                return (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setActiveTab(idx);
                      setSelectedCase(null);
                    }}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    style={
                      active ? { backgroundColor: "#0A6E75" } : undefined
                    }
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Case list */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading cases...
                </span>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  No cases in this category.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
                {filteredCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`w-full rounded-lg border p-4 text-left transition-all hover:border-[#0A6E75] ${
                      selectedCase?.id === c.id
                        ? "border-[#0A6E75] bg-[#0A6E75]/5 ring-1 ring-[#0A6E75]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {c.referenceNumber}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {formatStatus(c.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {c.partner.name}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">
                        {c.specialty}
                      </span>
                      <span>Patient: {c.patientRef}</span>
                      <span className="ml-auto">
                        {new Date(c.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {c.agreedFee && (
                      <p className="mt-1 text-xs font-medium text-gray-700">
                        Fee: {formatCurrency(c.agreedFee)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right panel — Case detail */}
          <div className="lg:col-span-3">
            {!selectedCase ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-24">
                <Briefcase className="h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">
                  Select a case from the queue to view details
                </p>
              </div>
            ) : (
              <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
                {/* Case header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedCase.referenceNumber}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Submitted{" "}
                      {new Date(selectedCase.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[selectedCase.status] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {formatStatus(selectedCase.status)}
                  </span>
                </div>

                {/* Section 1 — Partner & Contract */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <FileText className="h-4 w-4 text-[#0A6E75]" />
                    Partner & Contract
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Partner</p>
                      <p className="font-medium text-gray-900">
                        {selectedCase.partner.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contract</p>
                      <p className="font-medium text-gray-900">
                        {selectedCase.contract.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Service Type</p>
                      <p className="font-medium text-gray-900">
                        {selectedCase.serviceType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Agreed Fee</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(selectedCase.agreedFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">DFC Platform Fee</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(selectedCase.dfcPlatformFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Specialist Fee</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(selectedCase.specialistFee)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2 — Clinical */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Briefcase className="h-4 w-4 text-[#0A6E75]" />
                    Clinical Information
                  </h3>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Diagnosis</p>
                      <p className="font-medium text-gray-900">
                        {selectedCase.diagnosis}
                      </p>
                    </div>
                    {selectedCase.clinicalSummary && (
                      <div>
                        <p className="text-xs text-gray-500">
                          Clinical Summary
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedCase.clinicalSummary}
                        </p>
                      </div>
                    )}
                    {selectedCase.documentUrls &&
                      Array.isArray(selectedCase.documentUrls) &&
                      selectedCase.documentUrls.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Documents</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedCase.documentUrls.map(
                              (url: string, i: number) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#0A6E75] hover:bg-gray-50"
                                >
                                  Document {i + 1}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Section 3 — Assignment */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <UserPlus className="h-4 w-4 text-[#0A6E75]" />
                    Assignment
                  </h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">
                          Assign Specialist
                        </label>
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                        >
                          <option value="">Select a specialist...</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}{" "}
                              {m.doctorProfile?.specialty?.name
                                ? `(${m.doctorProfile.specialty.name})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleAssign}
                        disabled={
                          !selectedMemberId ||
                          assigning ||
                          selectedCase.status === "DELIVERED" ||
                          selectedCase.status === "PAID"
                        }
                        className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#0A6E75" }}
                      >
                        {assigning ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        Assign
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4 — Report */}
                {(selectedCase.status === "REPORT_READY" ||
                  selectedCase.status === "DELIVERED" ||
                  selectedCase.status === "BILLED" ||
                  selectedCase.status === "PAID" ||
                  selectedCase.reportText) && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CheckCircle2 className="h-4 w-4 text-[#0A6E75]" />
                      Report
                    </h3>
                    <div className="mt-3 space-y-3">
                      {selectedCase.reportText && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedCase.reportText}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Coordinator Notes
                        </label>
                        <textarea
                          value={coordNotes}
                          onChange={(e) => setCoordNotes(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                          placeholder="Add coordinator notes..."
                        />
                        <button
                          onClick={handleSaveNotes}
                          disabled={saving}
                          className="mt-2 inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Notes"}
                        </button>
                      </div>
                      {selectedCase.status === "REPORT_READY" && (
                        <button
                          onClick={handleDeliver}
                          disabled={delivering}
                          className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#0D1F3C" }}
                        >
                          {delivering ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 5 — Financial */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <DollarSign className="h-4 w-4 text-[#0A6E75]" />
                    Financial
                  </h3>
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Agreed Fee</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(selectedCase.agreedFee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Platform Fee</p>
                        <p className="text-base font-semibold text-[#0A6E75]">
                          {formatCurrency(selectedCase.dfcPlatformFee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Specialist Fee</p>
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(selectedCase.specialistFee)}
                        </p>
                      </div>
                    </div>
                    {selectedCase.status === "DELIVERED" && (
                      <button
                        disabled
                        className="mt-4 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Generate Invoice (Coming Soon)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
