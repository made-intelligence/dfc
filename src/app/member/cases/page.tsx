"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  PlayCircle,
  Inbox,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

interface Case {
  id: string;
  reference: string;
  patientName: string;
  specialty: string;
  tier: string;
  status: string;
  assignedAt: string;
  diagnosis: string;
  reviewStartedAt: string | null;
  reportDeliveredAt: string | null;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "COMPLETED", label: "Completed" },
] as const;

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

function formatPrivacyName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MemberCasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetchCases();
  }, [activeTab]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? `?status=${activeTab}` : "";
      const res = await fetch(`/api/member/cases${params}`);
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
      }
    } catch (error) {
      console.error("Failed to fetch cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Clock className="w-4 h-4" />;
      case "IN_REVIEW":
      case "REPORT_DRAFT":
        return <PlayCircle className="w-4 h-4" />;
      case "COMPLETED":
      case "REPORT_DELIVERED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-10 bg-gray-200 rounded w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
          <span className="inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-full bg-[#0D1F3C] text-white text-xs font-semibold">
            {cases.length}
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-[#0D1F3C] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases Grid */}
      {cases.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No cases found
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === "all"
              ? "You have not been assigned any cases yet."
              : `No ${statusLabels[activeTab]?.toLowerCase() || ""} cases at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors"
            >
              {/* Top row: reference + badges */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-gray-400 mb-1">
                    {c.reference}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrivacyName(c.patientName)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tierStyles[c.tier] || "bg-gray-100 text-gray-700"}`}
                  >
                    {c.tier}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {getStatusIcon(c.status)}
                    {statusLabels[c.status] || c.status}
                  </span>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                  <span>{c.specialty}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Assigned {formatDate(c.assignedAt)}</span>
                </div>
                {c.diagnosis && (
                  <p className="text-xs text-gray-500 line-clamp-1 pl-5">
                    {c.diagnosis}
                  </p>
                )}
              </div>

              {/* Action */}
              <Link
                href={`/member/cases/${c.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#0A4A50] hover:underline"
              >
                {c.status === "ASSIGNED"
                  ? "Start Review"
                  : c.status === "IN_REVIEW" || c.status === "REPORT_DRAFT"
                    ? "Continue Review"
                    : "View Report"}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
