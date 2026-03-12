"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

interface SPLCaseDetail {
  id: string;
  referenceNumber: string;
  partnerId: string;
  contractId: string;
  serviceType: string;
  status: string;
  patientRef: string;
  patientName: string;
  patientDob: string | null;
  patientEmail: string | null;
  patientPhone: string | null;
  membershipNumber: string | null;
  specialty: string;
  diagnosis: string;
  clinicalSummary: string | null;
  documentUrls: string[] | null;
  triageNotes: string | null;
  assignedToId: string | null;
  aiBrief: string | null;
  reportText: string | null;
  reportPdfUrl: string | null;
  coordinatorNotes: string | null;
  deliveredAt: string | null;
  agreedFee: number | null;
  dfcPlatformFee: number | null;
  specialistFee: number | null;
  invoiceId: string | null;
  paidAt: string | null;
  submittedAt: string;
  updatedAt: string;
  partner: {
    id: string;
    name: string;
    shortName: string;
  };
  contract: {
    id: string;
    title: string;
    model: string;
  };
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  TRIAGED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-indigo-100 text-indigo-700",
  REPORT_READY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  BILLED: "bg-teal-100 text-teal-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  SECOND_OPINION: "Second Opinion",
  SPECIALIST_CONSULTATION: "Specialist Consultation",
  SURGICAL_REVIEW: "Surgical Review",
};

const TIMELINE_STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "TRIAGED", label: "Triaged" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "REPORT_READY", label: "Report Ready" },
  { key: "DELIVERED", label: "Delivered" },
];

const REPORT_VISIBLE_STATUSES = [
  "REPORT_READY",
  "DELIVERED",
  "BILLED",
  "PAID",
];

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [splCase, setSplCase] = useState<SPLCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    try {
      const response = await fetch(`/api/spl/cases/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSplCase(data);
      } else {
        addToast({ title: "Error", description: "Failed to load case details", type: "error" });
      }
    } catch (error) {
      console.error("Error fetching case:", error);
      addToast({ title: "Error", description: "Failed to load case details", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatFee = (fee: number | null) => {
    if (fee === null || fee === undefined) return "--";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(fee);
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Parse clinical summary to extract specific questions if embedded
  const parseClinicalData = (summary: string | null) => {
    if (!summary) return { clinicalSummary: null, specificQuestions: null };
    const separator = "--- Specific Questions ---";
    if (summary.includes(separator)) {
      const parts = summary.split(separator);
      return {
        clinicalSummary: parts[0].trim() || null,
        specificQuestions: parts[1].trim() || null,
      };
    }
    return { clinicalSummary: summary, specificQuestions: null };
  };

  if (!user || loading) return <Loading />;
  if (!splCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-1">Case not found</h2>
          <p className="text-sm text-gray-500 mb-4">
            This case may not exist or you may not have permission to view it.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/spl/cases")}
          >
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(splCase.status);
  const isCancelled = splCase.status === "CANCELLED";
  const { clinicalSummary, specificQuestions } = parseClinicalData(splCase.clinicalSummary);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/spl/cases")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0D1F3C] mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Cases
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0D1F3C]">
                {splCase.referenceNumber}
              </h1>
              <p className="text-gray-500 mt-0.5">
                {splCase.patientName} &middot; {splCase.specialty}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium w-fit ${
                STATUS_BADGE_STYLES[splCase.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {formatStatus(splCase.status)}
            </span>
          </div>
        </div>

        {/* Section 1: Case Info */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="border-b bg-white pb-3">
            <CardTitle className="text-base text-[#0D1F3C] flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#0A6E75]" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem label="Reference Number" value={splCase.referenceNumber} />
              <InfoItem label="Patient Ref" value={splCase.patientRef} />
              <InfoItem label="Patient Name" value={splCase.patientName} />
              <InfoItem label="Specialty" value={splCase.specialty} />
              <InfoItem
                label="Service Type"
                value={SERVICE_TYPE_LABELS[splCase.serviceType] || splCase.serviceType}
              />
              <InfoItem label="Submitted" value={formatDate(splCase.submittedAt)} />
              {splCase.agreedFee !== null && (
                <InfoItem label="Agreed Fee" value={formatFee(splCase.agreedFee)} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Status Timeline */}
        {!isCancelled && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="border-b bg-white pb-3">
              <CardTitle className="text-base text-[#0D1F3C] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0A6E75]" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isFuture = index > currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                              ? "bg-[#0A6E75] text-white ring-4 ring-[#0A6E75]/20"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={`mt-1.5 text-[10px] font-medium text-center whitespace-nowrap ${
                            isCurrent
                              ? "text-[#0A6E75]"
                              : isCompleted
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-1 mt-[-1rem] ${
                            isCompleted ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-700">
              This case has been cancelled.
            </p>
          </div>
        )}

        {/* Section 3: Clinical Submission */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="border-b bg-white pb-3">
            <CardTitle className="text-base text-[#0D1F3C] flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#0A6E75]" />
              Clinical Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <DetailItem label="Diagnosis / Working Diagnosis" value={splCase.diagnosis} />
            {clinicalSummary && (
              <DetailItem label="Clinical Summary" value={clinicalSummary} />
            )}
            {specificQuestions && (
              <DetailItem label="Specific Questions" value={specificQuestions} />
            )}
            {splCase.documentUrls && Array.isArray(splCase.documentUrls) && splCase.documentUrls.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Documents
                </span>
                <div className="mt-1 space-y-1">
                  {(splCase.documentUrls as string[]).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#0A6E75] hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Report */}
        {REPORT_VISIBLE_STATUSES.includes(splCase.status) && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="border-b bg-white pb-3">
              <CardTitle className="text-base text-[#0D1F3C] flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0A6E75]" />
                Specialist Report
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {splCase.reportPdfUrl ? (
                  <a
                    href={splCase.reportPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    Report is being prepared and will be available for download shortly.
                  </p>
                )}
                {splCase.deliveredAt && (
                  <p className="text-sm text-gray-500">
                    Delivered on {formatDate(splCase.deliveredAt)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 5: Financial */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="border-b bg-white pb-3">
            <CardTitle className="text-base text-[#0D1F3C] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#0A6E75]" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem label="Agreed Fee" value={formatFee(splCase.agreedFee)} />
              <InfoItem
                label="Invoice"
                value={splCase.invoiceId || "Not yet invoiced"}
              />
              <InfoItem
                label="Payment Status"
                value={
                  splCase.paidAt
                    ? `Paid on ${formatDate(splCase.paidAt)}`
                    : splCase.status === "BILLED"
                    ? "Awaiting payment"
                    : "Pending"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/spl/cases")}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Cases
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm font-medium text-[#0D1F3C] mt-0.5">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap leading-relaxed">
        {value}
      </p>
    </div>
  );
}
