"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  TrendingUp,
  Clock,
  BarChart3,
  DollarSign,
} from "lucide-react";

interface VolumeSummary {
  totalCases: number;
  casesThisMonth: number;
  averagePerMonth: number;
  deliveredRate: number;
}

interface TurnaroundRow {
  specialty: string;
  avgDays: number;
  cases: number;
}

interface SpecialtyRow {
  specialty: string;
  caseCount: number;
  avgFee: number;
  percentOfTotal: number;
}

interface FinancialSummary {
  totalSpend: number;
  thisPeriodSpend: number;
  outstandingAmount: number;
  contractedVolumeUsed: number | null;
  subscribedVolume: number | null;
}

interface ReportsData {
  volumeSummary: VolumeSummary;
  turnaroundAnalysis: TurnaroundRow[];
  specialtyBreakdown: SpecialtyRow[];
  financialSummary: FinancialSummary;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("NGN", "\u20A6");
}

export default function SPLReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/spl/reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reports");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0A6E75" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || "No data available"}</p>
      </div>
    );
  }

  const { volumeSummary, turnaroundAnalysis, specialtyBreakdown, financialSummary } =
    data;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-serif" style={{ color: "#0D1F3C" }}>
          Reports
        </h1>
        <p className="text-gray-500 mt-1">
          Analytics and insights for your specialist partnership.
        </p>
      </div>

      {/* Section 1 — Volume Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" style={{ color: "#0A6E75" }} />
          <h2 className="text-lg font-semibold" style={{ color: "#0D1F3C" }}>
            Volume Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Cases" value={volumeSummary.totalCases.toString()} />
          <StatCard
            label="Cases This Month"
            value={volumeSummary.casesThisMonth.toString()}
          />
          <StatCard
            label="Average per Month"
            value={volumeSummary.averagePerMonth.toString()}
          />
          <StatCard
            label="Delivered Rate"
            value={`${volumeSummary.deliveredRate}%`}
            highlight={volumeSummary.deliveredRate >= 80}
          />
        </div>
      </div>

      {/* Section 2 — Turnaround Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" style={{ color: "#0A6E75" }} />
          <h2 className="text-lg font-semibold" style={{ color: "#0D1F3C" }}>
            Turnaround Analysis
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {turnaroundAnalysis.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No delivered cases to analyze yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Specialty
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Avg Days to Delivery
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Cases
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {turnaroundAnalysis.map((row) => (
                    <tr key={row.specialty} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 font-medium"
                        style={{ color: "#0D1F3C" }}
                      >
                        {row.specialty}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {row.avgDays} days
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.cases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 3 — Specialty Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5" style={{ color: "#0A6E75" }} />
          <h2 className="text-lg font-semibold" style={{ color: "#0D1F3C" }}>
            Specialty Breakdown
          </h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {specialtyBreakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No cases to show.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Specialty
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Case Count
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      Avg Fee
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {specialtyBreakdown.map((row) => (
                    <tr key={row.specialty} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 font-medium"
                        style={{ color: "#0D1F3C" }}
                      >
                        {row.specialty}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {row.caseCount}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatCurrency(row.avgFee)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                backgroundColor: "#0A6E75",
                                width: `${row.percentOfTotal}%`,
                              }}
                            />
                          </div>
                          <span>{row.percentOfTotal}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 4 — Financial Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5" style={{ color: "#0A6E75" }} />
          <h2 className="text-lg font-semibold" style={{ color: "#0D1F3C" }}>
            Financial Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Spend (All Time)"
            value={formatCurrency(financialSummary.totalSpend)}
          />
          <StatCard
            label="This Period"
            value={formatCurrency(financialSummary.thisPeriodSpend)}
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(financialSummary.outstandingAmount)}
            highlight={financialSummary.outstandingAmount > 0}
            highlightColor="red"
          />
          {financialSummary.subscribedVolume !== null && (
            <StatCard
              label="Contracted Volume Used"
              value={`${financialSummary.contractedVolumeUsed ?? 0} / ${financialSummary.subscribedVolume}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  highlightColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: "green" | "red";
}) {
  const borderColor = highlight
    ? highlightColor === "red"
      ? "#ef4444"
      : "#0A6E75"
    : "#e5e7eb";
  const bgColor = highlight
    ? highlightColor === "red"
      ? "rgba(239,68,68,0.04)"
      : "rgba(10,110,117,0.04)"
    : "#fff";

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: "#0D1F3C" }}>
        {value}
      </p>
    </div>
  );
}
