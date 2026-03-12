"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  FileText,
  Download,
  ChevronRight,
} from "lucide-react";

interface SPLCase {
  id: string;
  referenceNumber: string;
  patientRef: string;
  patientName: string;
  specialty: string;
  serviceType: string;
  status: string;
  agreedFee: number | null;
  reportPdfUrl: string | null;
  submittedAt: string;
  contract?: {
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

type FilterTab = "ALL" | "SUBMITTED" | "IN_PROGRESS" | "DELIVERED" | "BILLED";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "BILLED", label: "Billed" },
];

const IN_PROGRESS_STATUSES = ["TRIAGED", "ASSIGNED", "IN_REVIEW", "REPORT_READY"];

const REPORT_VISIBLE_STATUSES = [
  "REPORT_READY",
  "DELIVERED",
  "BILLED",
  "PAID",
];

export default function CasesListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [cases, setCases] = useState<SPLCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch("/api/spl/cases");
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      } else {
        addToast({ title: "Error", description: "Failed to load cases", type: "error" });
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      addToast({ title: "Error", description: "Failed to load cases", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    switch (activeTab) {
      case "SUBMITTED":
        return c.status === "SUBMITTED";
      case "IN_PROGRESS":
        return IN_PROGRESS_STATUSES.includes(c.status);
      case "DELIVERED":
        return c.status === "DELIVERED";
      case "BILLED":
        return c.status === "BILLED" || c.status === "PAID";
      default:
        return true;
    }
  });

  const formatDate = (dateStr: string) => {
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

  if (!user) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F3C]">SPL Cases</h1>
            <p className="text-gray-500 mt-1">
              Manage and track specialist review cases
            </p>
          </div>
          <Button
            onClick={() => router.push("/spl/cases/new")}
            className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Submit New Case
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 border w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-[#0D1F3C] text-white"
                  : "text-gray-600 hover:text-[#0D1F3C] hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cases Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loading />
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No cases found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {activeTab === "ALL"
                    ? "You haven't submitted any cases yet."
                    : `No cases with status "${activeTab.replace(/_/g, " ").toLowerCase()}".`}
                </p>
                {activeTab === "ALL" && (
                  <Button
                    onClick={() => router.push("/spl/cases/new")}
                    className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white"
                  >
                    Submit Your First Case
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Reference
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Patient Ref
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Specialty
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Service Type
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Submitted
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Fee
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                        Report
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCases.map((splCase) => (
                      <tr
                        key={splCase.id}
                        onClick={() => router.push(`/spl/cases/${splCase.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-[#0D1F3C]">
                            {splCase.referenceNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{splCase.patientRef}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{splCase.specialty}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {SERVICE_TYPE_LABELS[splCase.serviceType] || splCase.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">
                            {formatDate(splCase.submittedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_BADGE_STYLES[splCase.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {formatStatus(splCase.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {formatFee(splCase.agreedFee)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {REPORT_VISIBLE_STATUSES.includes(splCase.status) &&
                          splCase.reportPdfUrl ? (
                            <a
                              href={splCase.reportPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#0A6E75] hover:text-[#0A6E75]/80"
                              title="Download report"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-gray-300">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
