"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  PlayCircle,
  FileText,
  User,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Video,
  Calendar,
  AlertTriangle,
  Save,
  Send,
  X,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface CaseDetail {
  id: string;
  reference: string;
  patientName: string;
  specialty: string;
  tier: string;
  status: string;
  assignedAt: string;
  diagnosis: string;
  proposedTreatment: string;
  specificQuestions: string;
  aiBrief: string;
  documents: { id: string; name: string; url: string }[];
  specialistNotes: string;
  reportContent: string;
  reportDeliveredAt: string | null;
  reviewStartedAt: string | null;
  scheduledCallTime: string | null;
  meetingLink: string | null;
}

const statusStyles: Record<string, string> = {
  ASSIGNED: "bg-amber-50 text-amber-700 border border-amber-200",
  IN_REVIEW: "bg-blue-50 text-blue-700 border border-blue-200",
  REPORT_DRAFT: "bg-purple-50 text-purple-700 border border-purple-200",
  COMPLETED: "bg-green-50 text-green-700 border border-green-200",
  REPORT_DELIVERED: "bg-green-50 text-green-700 border border-green-200",
};

const statusLabels: Record<string, string> = {
  ASSIGNED: "Assigned",
  IN_REVIEW: "In Review",
  REPORT_DRAFT: "Draft",
  COMPLETED: "Completed",
  REPORT_DELIVERED: "Delivered",
};

const tierStyles: Record<string, string> = {
  STANDARD: "bg-gray-100 text-gray-700",
  COMPLEX: "bg-[#0A4A50]/10 text-[#0A4A50]",
  ONCOLOGY: "bg-[#0D1F3C]/10 text-[#0D1F3C]",
  URGENT: "bg-red-50 text-red-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemberCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiBriefOpen, setAiBriefOpen] = useState(false);
  const [specialistNotes, setSpecialistNotes] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/member/cases/${caseId}`);
      const data = await res.json();
      if (data.success) {
        setCaseData(data.case);
        setSpecialistNotes(data.case.specialistNotes || "");
        setReportContent(data.case.reportContent || "");
      }
    } catch (error) {
      console.error("Failed to fetch case:", error);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handlePatch = async (body: Record<string, string>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/member/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "Success",
          description: body.action === "start_review"
            ? "Review started"
            : body.action === "submit_report"
              ? "Report submitted successfully"
              : "Draft saved",
          type: "success",
        });
        await fetchCase();
      } else {
        addToast({
          title: "Error",
          description: data.error || "Something went wrong",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Failed to update case:", error);
      addToast({
        title: "Error",
        description: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
      setShowSubmitModal(false);
    }
  };

  const handleStartReview = () => handlePatch({ action: "start_review" });

  const handleSaveDraft = () =>
    handlePatch({ specialistNotes, reportContent });

  const handleSubmitReport = () =>
    handlePatch({ action: "submit_report", reportContent });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-1">
          Case not found
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          This case may have been removed or you do not have access.
        </p>
        <Link
          href="/member/cases"
          className="text-sm font-medium text-[#0A4A50] hover:underline"
        >
          Back to My Cases
        </Link>
      </div>
    );
  }

  const isEditable =
    caseData.status === "IN_REVIEW" || caseData.status === "REPORT_DRAFT";
  const isCompleted =
    caseData.status === "COMPLETED" || caseData.status === "REPORT_DELIVERED";
  const showVideoCall =
    caseData.tier === "COMPLEX" || caseData.tier === "ONCOLOGY";

  return (
    <div>
      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Report
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will finalize the report and send it to the patient. This
                  action cannot be undone. Are you sure you want to proceed?
                </p>
              </div>
            </div>
            {!reportContent.trim() && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                Please write a report before submitting.
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={actionLoading || !reportContent.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/member/cases"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Cases
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">
              {caseData.reference}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Case Review</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${tierStyles[caseData.tier] || "bg-gray-100 text-gray-700"}`}
            >
              {caseData.tier}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[caseData.status] || "bg-gray-100 text-gray-600"}`}
            >
              {statusLabels[caseData.status] || caseData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Case Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Case Details</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Patient
              </p>
              <p className="text-sm font-medium text-gray-900">
                {caseData.patientName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Specialty
              </p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                {caseData.specialty}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Tier
              </p>
              <p className="text-sm font-medium text-gray-900">
                {caseData.tier}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Assigned
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formatDate(caseData.assignedAt)}
              </p>
            </div>
          </div>

          {caseData.diagnosis && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Diagnosis
              </p>
              <p className="text-sm text-gray-900">{caseData.diagnosis}</p>
            </div>
          )}

          {caseData.proposedTreatment && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Proposed Treatment
              </p>
              <p className="text-sm text-gray-900">
                {caseData.proposedTreatment}
              </p>
            </div>
          )}

          {caseData.specificQuestions && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Specific Questions
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {caseData.specificQuestions}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Brief Card */}
      {caseData.aiBrief && (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <button
            onClick={() => setAiBriefOpen(!aiBriefOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0A4A50]" />
              <h2 className="font-semibold text-gray-900">AI Brief</h2>
            </div>
            {aiBriefOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {aiBriefOpen && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {caseData.aiBrief}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents Card */}
      {caseData.documents && caseData.documents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Documents</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {caseData.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#0A4A50] hover:underline p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  {doc.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Call Section (COMPLEX/ONCOLOGY tiers) */}
      {showVideoCall && (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              Video Consultation
            </h2>
          </div>
          <div className="p-6">
            {caseData.scheduledCallTime ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-900 font-medium">
                    Scheduled Call
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDateTime(caseData.scheduledCallTime)}
                  </p>
                </div>
                {caseData.meetingLink && (
                  <a
                    href={caseData.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A4A50] text-white text-sm font-medium rounded-lg hover:bg-[#0A4A50]/90 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Join Call
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Video call scheduling will be available once the review is in
                  progress.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar: Start Review */}
      {caseData.status === "ASSIGNED" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <div className="text-center">
            <PlayCircle className="w-10 h-10 text-[#0A4A50] mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Ready to start your review?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Click below to begin reviewing this case. You can save drafts and
              return at any time.
            </p>
            <button
              onClick={handleStartReview}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0A4A50] text-white text-sm font-medium rounded-lg hover:bg-[#0A4A50]/90 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                "Starting..."
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Review
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Review Workspace */}
      {isEditable && (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0A4A50]" />
            <h2 className="font-semibold text-gray-900">Review Workspace</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Specialist Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialist Notes
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (Private -- for your personal use during review)
                </span>
              </label>
              <textarea
                value={specialistNotes}
                onChange={(e) => setSpecialistNotes(e.target.value)}
                rows={4}
                placeholder="Your personal notes about this case..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A4A50]/20 focus:border-[#0A4A50] resize-y"
              />
            </div>

            {/* Report */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report
                <span className="text-xs font-normal text-gray-400 ml-1">
                  (This will be delivered to the patient)
                </span>
              </label>
              <div className="mb-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                <p className="font-medium mb-1">Formatting guidance:</p>
                <p>
                  Write in clear, professional language accessible to the
                  patient. Structure your report with headings where
                  appropriate. Include your clinical assessment, recommendations,
                  and any follow-up actions.
                </p>
              </div>
              <textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                rows={10}
                placeholder="Write your specialist report here..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A4A50]/20 focus:border-[#0A4A50] resize-y"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={handleSaveDraft}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {actionLoading ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0D1F3C] text-white text-sm font-medium rounded-lg hover:bg-[#0D1F3C]/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed State: Read-only Report */}
      {isCompleted && caseData.reportContent && (
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Submitted Report</h2>
            </div>
            {caseData.reportDeliveredAt && (
              <p className="text-xs text-gray-500">
                Delivered {formatDateTime(caseData.reportDeliveredAt)}
              </p>
            )}
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {caseData.reportContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
