"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CheckCircle,
  Clock,
  Gauge,
  ArrowRight,
  Receipt,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalSubmitted: number;
  totalDelivered: number;
  pendingReview: number;
  totalAssigned: number;
  totalCancelled: number;
  volumeRemaining: number | null;
}

interface RecentCase {
  id: string;
  referenceNumber: string;
  patientRef: string;
  serviceType: string;
  status: string;
  createdAt: string;
}

interface ContractSummary {
  id: string;
  title: string;
  model: string;
  status: string;
  subscribedVolume: number | null;
  casesDeliveredThisPeriod: number | null;
  casesRemainingThisPeriod: number | null;
  startDate: string;
  endDate: string | null;
}

interface DashboardData {
  stats: DashboardStats;
  recentCases: RecentCase[];
  contract: ContractSummary | null;
}

function getCaseStatusBadge(status: string) {
  const styles: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-800",
    TRIAGED: "bg-purple-100 text-purple-800",
    ASSIGNED: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-orange-100 text-orange-800",
    REPORT_PENDING: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    DISPUTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-600",
  };
  return styles[status] || "bg-gray-100 text-gray-600";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SPLDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/spl/dashboard", {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#0A6E75", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const recentCases = data?.recentCases || [];
  const contract = data?.contract;

  const statCards = [
    {
      label: "Cases Submitted",
      value: stats?.totalSubmitted ?? 0,
      icon: Briefcase,
      color: "#0D1F3C",
      bg: "bg-[#0D1F3C]/5",
    },
    {
      label: "Cases Delivered",
      value: stats?.totalDelivered ?? 0,
      icon: CheckCircle,
      color: "#0A6E75",
      bg: "bg-[#0A6E75]/5",
    },
    {
      label: "Pending Review",
      value: stats?.pendingReview ?? 0,
      icon: Clock,
      color: "#D97706",
      bg: "bg-amber-50",
    },
    {
      label: "Volume Remaining",
      value: stats?.volumeRemaining ?? "--",
      icon: Gauge,
      color: "#7C3AED",
      bg: "bg-violet-50",
      hidden: stats?.volumeRemaining === null,
    },
  ];

  const visibleStats = statCards.filter((s) => !s.hidden);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold font-serif"
          style={{ color: "#0D1F3C" }}
        >
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your specialist case activity
        </p>
      </div>

      {/* Stat cards */}
      <div
        className={`grid gap-4 ${
          visibleStats.length === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3"
        }`}
      >
        {visibleStats.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl border border-gray-100 p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                {card.label}
              </span>
              <card.icon
                className="h-5 w-5"
                style={{ color: card.color }}
              />
            </div>
            <p
              className="text-3xl font-bold font-serif"
              style={{ color: card.color }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases — spans 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2
              className="text-lg font-semibold font-serif"
              style={{ color: "#0D1F3C" }}
            >
              Recent Cases
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm"
              style={{ color: "#0A6E75" }}
              onClick={() => router.push("/spl/cases")}
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {recentCases.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400">
              <Briefcase className="mx-auto h-10 w-10 mb-3 text-gray-300" />
              <p className="text-sm">No cases submitted yet.</p>
              <Button
                className="mt-4 text-white"
                style={{ backgroundColor: "#0A6E75" }}
                onClick={() => router.push("/spl/cases/new")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit Your First Case
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-50">
                    <th className="px-5 py-3 font-medium">Reference</th>
                    <th className="px-5 py-3 font-medium">Patient Ref</th>
                    <th className="px-5 py-3 font-medium">Specialty</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentCases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/spl/cases/${c.id}`)}
                    >
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: "#0A6E75" }}>
                        {c.referenceNumber}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {c.patientRef}
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {c.serviceType}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCaseStatusBadge(c.status)}`}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: Contract summary + Quick actions */}
        <div className="space-y-6">
          {/* Contract Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2
              className="text-lg font-semibold font-serif mb-4"
              style={{ color: "#0D1F3C" }}
            >
              Contract Summary
            </h2>
            {contract ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Contract</p>
                  <p className="font-medium text-gray-900">{contract.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500">Status:</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      contract.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Model</p>
                  <p className="font-medium text-gray-900">
                    {contract.model.replace(/_/g, " ")}
                  </p>
                </div>
                {contract.subscribedVolume !== null && (
                  <div>
                    <p className="text-gray-500">Volume</p>
                    <p className="font-medium text-gray-900">
                      {contract.casesDeliveredThisPeriod ?? 0} /{" "}
                      {contract.subscribedVolume} cases
                    </p>
                    <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: "#0A6E75",
                          width: `${Math.min(
                            ((contract.casesDeliveredThisPeriod ?? 0) /
                              (contract.subscribedVolume || 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {contract.endDate && (
                  <div>
                    <p className="text-gray-500">Expires</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(contract.endDate)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No active contract found.
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2
              className="text-lg font-semibold font-serif mb-4"
              style={{ color: "#0D1F3C" }}
            >
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Button
                className="w-full justify-start text-white"
                style={{ backgroundColor: "#0A6E75" }}
                onClick={() => router.push("/spl/cases/new")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Submit a Case
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                style={{ borderColor: "#0D1F3C", color: "#0D1F3C" }}
                onClick={() => router.push("/spl/invoices")}
              >
                <Receipt className="mr-2 h-4 w-4" />
                View Invoices
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
