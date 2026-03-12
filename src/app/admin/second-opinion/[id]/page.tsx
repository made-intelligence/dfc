"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Stethoscope,
  Brain,
  FileText,
  UserCheck,
  Clock,
  ClipboardList,
  StickyNote,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Document {
  url: string;
  name: string;
  type: string;
  uploadedAt?: string;
}

interface Specialist {
  id: string;
  slug: string;
  title: string;
  institution: string;
  country: string;
  user: { name: string; email: string };
  specialty: { name: string };
}

interface SOCase {
  id: string;
  reference: string;
  patientName: string;
  patientDob: string | null;
  contactEmail: string;
  contactPhone: string | null;
  requesterType: string;
  userId: string | null;
  specialty: string;
  diagnosis: string;
  proposedTreatment: string | null;
  specificQuestions: string | null;
  documents: Document[] | null;
  tier: "STANDARD" | "COMPLEX" | "ONCOLOGY";
  amountKobo: number;
  paymentReference: string | null;
  paidAt: string | null;
  status: string;
  aiBrief: string | null;
  specialistId: string | null;
  specialist: Specialist | null;
  assignedAt: string | null;
  assignedById: string | null;
  reviewStartedAt: string | null;
  specialistNotes: string | null;
  reportContent: string | null;
  reportPdfUrl: string | null;
  reportDeliveredAt: string | null;
  videoCallScheduledAt: string | null;
  videoCallLink: string | null;
  videoCallCompletedAt: string | null;
  coordinatorNotes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  id: string;
  userId: string;
  memberNumber?: string;
  category?: string;
  user: { name: string; email: string };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-800",
  PAID: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-indigo-100 text-indigo-800",
  REPORT_DRAFT: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  PAID: "Paid",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In Review",
  REPORT_DRAFT: "Report Draft",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const TIER_COLORS: Record<string, string> = {
  STANDARD: "bg-teal-100 text-teal-800",
  COMPLEX: "bg-amber-100 text-amber-800",
  ONCOLOGY: "bg-rose-100 text-rose-800",
};

const WORKFLOW_STAGES = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "PAID", label: "Paid" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "REPORT_DRAFT", label: "Report Draft" },
  { key: "COMPLETED", label: "Completed" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDocuments(docs: Document[] | string | null | undefined): Document[] {
  if (!docs) return [];
  if (typeof docs === "string") {
    try {
      const parsed = JSON.parse(docs);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(docs) ? docs : [];
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SecondOpinionCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [soCase, setSoCase] = useState<SOCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coordinator notes
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // AI Brief collapsible
  const [aiBriefOpen, setAiBriefOpen] = useState(false);

  // Specialist search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualSpecialistId, setManualSpecialistId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Complete action
  const [completing, setCompleting] = useState(false);

  /* ---- Fetch case ---- */
  const fetchCase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/second-opinion/${caseId}`);
      if (!res.ok) throw new Error("Failed to fetch case");
      const data = await res.json();
      if (!data.success) throw new Error("Case not found");
      setSoCase(data.case);
      setNotes(data.case.coordinatorNotes ?? "");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) fetchCase();
  }, [caseId, fetchCase]);

  /* ---- Specialist search ---- */
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/admin/exco/search?q=${encodeURIComponent(searchTerm)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results ?? []);
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ---- Actions ---- */
  async function assignSpecialist(specialistId: string) {
    if (!specialistId.trim()) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/admin/second-opinion/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialistId: specialistId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");
      await fetchCase();
      setSearchTerm("");
      setSearchResults([]);
      setManualSpecialistId("");
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  async function saveNotes() {
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      await fetch(`/api/admin/second-opinion/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorNotes: notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setNotesSaving(false);
    }
  }

  async function cancelCase() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await fetch(`/api/admin/second-opinion/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", cancelReason: cancelReason.trim() }),
      });
      setShowCancelModal(false);
      setCancelReason("");
      await fetchCase();
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  }

  async function markCompleted() {
    setCompleting(true);
    try {
      await fetch(`/api/admin/second-opinion/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      await fetchCase();
    } catch {
      // silent
    } finally {
      setCompleting(false);
    }
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A4A50]" />
      </div>
    );
  }

  if (error || !soCase) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/admin/second-opinion"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cases
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">{error || "Case not found"}</p>
        </div>
      </div>
    );
  }

  const docs = parseDocuments(soCase.documents);
  const isCancelled = soCase.status === "CANCELLED";
  const isCompleted = soCase.status === "COMPLETED";
  const isTerminal = isCancelled || isCompleted || soCase.status === "REFUNDED";

  // Determine which workflow stage is current
  const currentStageIndex = WORKFLOW_STAGES.findIndex((s) => s.key === soCase.status);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* ============================================================= */}
      {/*  HEADER                                                        */}
      {/* ============================================================= */}
      <div>
        <Link
          href="/admin/second-opinion"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to cases
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            {soCase.reference}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[soCase.status] || "bg-gray-100 text-gray-700"}`}
            >
              {STATUS_LABELS[soCase.status] || soCase.status}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TIER_COLORS[soCase.tier] || "bg-gray-100 text-gray-700"}`}
            >
              {soCase.tier}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* ========================================================= */}
          {/*  PATIENT INFO                                              */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div
              className="flex items-center gap-2 rounded-t-lg px-5 py-3"
              style={{ backgroundColor: "#0D1F3C" }}
            >
              <User className="h-4 w-4 text-white" />
              <h2 className="text-sm font-semibold text-white">Patient Information</h2>
            </div>
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Name
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">
                  {soCase.patientName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date of Birth
                </p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {formatDate(soCase.patientDob)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Email
                </p>
                <p className="mt-0.5 break-all text-sm text-gray-900">
                  {soCase.contactEmail}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Phone
                </p>
                <p className="mt-0.5 text-sm text-gray-900">
                  {soCase.contactPhone || "--"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Requester Type
                </p>
                <p className="mt-0.5 text-sm capitalize text-gray-900">
                  {soCase.requesterType}
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/*  CLINICAL DETAILS                                          */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div
              className="flex items-center gap-2 rounded-t-lg px-5 py-3"
              style={{ backgroundColor: "#0A4A50" }}
            >
              <Stethoscope className="h-4 w-4 text-white" />
              <h2 className="text-sm font-semibold text-white">Clinical Details</h2>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Specialty
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-900">
                  {soCase.specialty}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Diagnosis
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
                  {soCase.diagnosis}
                </p>
              </div>
              {soCase.proposedTreatment && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Proposed Treatment
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
                    {soCase.proposedTreatment}
                  </p>
                </div>
              )}
              {soCase.specificQuestions && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Specific Questions
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
                    {soCase.specificQuestions}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/*  AI BRIEF                                                  */}
          {/* ========================================================= */}
          {soCase.aiBrief && (
            <section className="rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setAiBriefOpen(!aiBriefOpen)}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#0A4A50]" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    AI Clinical Brief
                  </h2>
                </div>
                {aiBriefOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {aiBriefOpen && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="whitespace-pre-wrap rounded-md bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
                    {soCase.aiBrief}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ========================================================= */}
          {/*  DOCUMENTS                                                 */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <FileText className="h-4 w-4 text-[#0A4A50]" />
              <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              {docs.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate text-sm text-gray-900">
                          {doc.name || `Document ${i + 1}`}
                        </span>
                        {doc.type && (
                          <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                            {doc.type}
                          </span>
                        )}
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 flex-shrink-0 text-[#0A4A50] hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/*  SPECIALIST ASSIGNMENT                                     */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <UserCheck className="h-4 w-4 text-[#0A4A50]" />
              <h2 className="text-sm font-semibold text-gray-900">
                Specialist Assignment
              </h2>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              {soCase.specialist ? (
                /* Already assigned */
                <div className="space-y-3">
                  <div className="rounded-md border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-800">
                      Assigned to {soCase.specialist.user.name}
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      {soCase.specialist.specialty?.name || "General"} &middot;{" "}
                      {soCase.specialist.institution || "--"} &middot;{" "}
                      {soCase.specialist.country || "--"}
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Assigned on {formatDateTime(soCase.assignedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                /* Not assigned — show search + manual input */
                <div className="space-y-4">
                  {isTerminal && (
                    <p className="text-sm text-gray-500">
                      This case is {soCase.status.toLowerCase()} and cannot be assigned.
                    </p>
                  )}

                  {!isTerminal && (
                    <>
                      {/* Search for specialists */}
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Search Specialists
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or email (min 2 chars)"
                            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-[#0A4A50] focus:outline-none focus:ring-1 focus:ring-[#0A4A50]"
                          />
                        </div>

                        {searchLoading && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                          </div>
                        )}

                        {searchResults.length > 0 && (
                          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                            {searchResults.map((result) => (
                              <button
                                key={result.id}
                                onClick={() => assignSpecialist(result.userId)}
                                disabled={assigning}
                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {result.user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {result.user.email}
                                    {result.category
                                      ? ` - ${result.category}`
                                      : ""}
                                  </p>
                                </div>
                                <span className="ml-2 flex-shrink-0 rounded bg-[#0A4A50] px-2 py-1 text-xs font-medium text-white">
                                  Assign
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchTerm.length >= 2 &&
                          !searchLoading &&
                          searchResults.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                              No results found.
                            </p>
                          )}
                      </div>

                      {/* Manual specialist ID */}
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                          Or Paste DoctorProfile ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualSpecialistId}
                            onChange={(e) => setManualSpecialistId(e.target.value)}
                            placeholder="DoctorProfile ID"
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0A4A50] focus:outline-none focus:ring-1 focus:ring-[#0A4A50]"
                          />
                          <button
                            onClick={() => assignSpecialist(manualSpecialistId)}
                            disabled={!manualSpecialistId.trim() || assigning}
                            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                            style={{ backgroundColor: "#0A4A50" }}
                          >
                            {assigning ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Assign"
                            )}
                          </button>
                        </div>
                      </div>

                      {assignError && (
                        <p className="text-sm text-red-600">{assignError}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/*  REPORT                                                    */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <ClipboardList className="h-4 w-4 text-[#0A4A50]" />
              <h2 className="text-sm font-semibold text-gray-900">Report</h2>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              {soCase.reportContent ? (
                <div className="space-y-3">
                  <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                    {soCase.reportContent}
                  </div>
                  {soCase.reportPdfUrl && (
                    <a
                      href={soCase.reportPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-[#0A4A50] px-4 py-2 text-sm font-medium text-[#0A4A50] hover:bg-[#0A4A50]/5"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  )}
                  {soCase.reportDeliveredAt && (
                    <p className="text-xs text-gray-500">
                      Delivered on {formatDateTime(soCase.reportDeliveredAt)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No report has been submitted yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-6">
          {/* ========================================================= */}
          {/*  TIMELINE                                                  */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <Clock className="h-4 w-4 text-[#0A4A50]" />
              <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              {isCancelled || soCase.status === "REFUNDED" ? (
                <div className="space-y-3">
                  {WORKFLOW_STAGES.slice(0, Math.max(currentStageIndex, 1) + 1).map(
                    (stage, i) => (
                      <TimelineItem
                        key={stage.key}
                        label={stage.label}
                        date={getStageDate(soCase, stage.key)}
                        isActive={false}
                        isCompleted={true}
                        isLast={i === Math.max(currentStageIndex, 0)}
                      />
                    )
                  )}
                  <TimelineItem
                    label={soCase.status === "REFUNDED" ? "Refunded" : "Cancelled"}
                    date={soCase.updatedAt}
                    isActive={true}
                    isCompleted={false}
                    isLast={true}
                    variant="error"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {WORKFLOW_STAGES.map((stage, i) => {
                    const stageIndex = WORKFLOW_STAGES.findIndex(
                      (s) => s.key === stage.key
                    );
                    const isPast = stageIndex < currentStageIndex;
                    const isCurrent = stageIndex === currentStageIndex;
                    return (
                      <TimelineItem
                        key={stage.key}
                        label={stage.label}
                        date={getStageDate(soCase, stage.key)}
                        isActive={isCurrent}
                        isCompleted={isPast}
                        isLast={i === WORKFLOW_STAGES.length - 1}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/*  COORDINATOR NOTES                                         */}
          {/* ========================================================= */}
          <section className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <StickyNote className="h-4 w-4 text-[#0A4A50]" />
              <h2 className="text-sm font-semibold text-gray-900">
                Coordinator Notes
              </h2>
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this case..."
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0A4A50] focus:outline-none focus:ring-1 focus:ring-[#0A4A50]"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={saveNotes}
                  disabled={notesSaving}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "#0A4A50" }}
                >
                  {notesSaving ? "Saving..." : "Save Notes"}
                </button>
                {notesSaved && (
                  <span className="text-xs text-green-600">Saved!</span>
                )}
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/*  ACTIONS                                                   */}
          {/* ========================================================= */}
          {!isTerminal && (
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="px-5 py-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Actions</h2>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={markCompleted}
                    disabled={completing}
                    className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#0A4A50" }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {completing ? "Completing..." : "Mark as Completed"}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Case
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Show cancel reason if cancelled */}
          {isCancelled && soCase.cancelReason && (
            <section className="rounded-lg border border-red-200 bg-red-50">
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                  Cancellation Reason
                </p>
                <p className="mt-1 text-sm text-red-800">{soCase.cancelReason}</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/*  CANCEL MODAL                                                  */}
      {/* ============================================================= */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3
              className="mb-4 text-lg font-semibold"
              style={{ color: "#0D1F3C" }}
            >
              Cancel Case
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Please provide a reason for cancelling case{" "}
              <strong>{soCase.reference}</strong>.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Cancellation reason..."
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={cancelCase}
                disabled={!cancelReason.trim() || cancelling}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Item Sub-component                                        */
/* ------------------------------------------------------------------ */

function TimelineItem({
  label,
  date,
  isActive,
  isCompleted,
  isLast,
  variant,
}: {
  label: string;
  date: string | null;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
  variant?: "error";
}) {
  const dotColor = variant === "error"
    ? "bg-red-500"
    : isActive
      ? "bg-[#0A4A50] ring-4 ring-[#0A4A50]/20"
      : isCompleted
        ? "bg-[#0A4A50]"
        : "bg-gray-300";

  const lineColor = isCompleted ? "bg-[#0A4A50]" : "bg-gray-200";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-3 w-3 flex-shrink-0 rounded-full ${dotColor}`} />
        {!isLast && <div className={`mt-1 w-0.5 flex-1 ${lineColor}`} />}
      </div>
      <div className={`pb-4 ${isLast ? "pb-0" : ""}`}>
        <p
          className={`text-sm font-medium ${
            isActive || isCompleted
              ? variant === "error"
                ? "text-red-700"
                : "text-gray-900"
              : "text-gray-400"
          }`}
        >
          {label}
        </p>
        {date && (
          <p className="text-xs text-gray-500">{formatDateTime(date)}</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Get date for a workflow stage                               */
/* ------------------------------------------------------------------ */

function getStageDate(soCase: SOCase, stageKey: string): string | null {
  switch (stageKey) {
    case "SUBMITTED":
      return soCase.createdAt;
    case "PAID":
      return soCase.paidAt;
    case "ASSIGNED":
      return soCase.assignedAt;
    case "IN_REVIEW":
      return soCase.reviewStartedAt;
    case "REPORT_DRAFT":
      return null; // No specific field — could be inferred
    case "COMPLETED":
      return soCase.reportDeliveredAt;
    default:
      return null;
  }
}
