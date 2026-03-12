"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Search,
  FileText,
  Clock,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CaseStatus =
  | "SUBMITTED"
  | "PAID"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "REPORT_DRAFT"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

interface SecondOpinionCase {
  id: string;
  reference: string;
  patientName: string;
  contactEmail: string;
  specialty: string;
  tier: string;
  status: CaseStatus;
  createdAt: string;
  assignedAt: string | null;
  specialist: {
    user: { name: string };
    specialty: { name: string };
  } | null;
}

interface CaseCounts {
  SUBMITTED: number;
  PAID: number;
  ASSIGNED: number;
  IN_REVIEW: number;
  REPORT_DRAFT: number;
  COMPLETED: number;
  CANCELLED: number;
  REFUNDED: number;
}

interface ApiResponse {
  success: boolean;
  cases: SecondOpinionCase[];
  total: number;
  page: number;
  totalPages: number;
  counts: CaseCounts;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<CaseStatus, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  PAID: "bg-amber-100 text-amber-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_REVIEW: "bg-purple-100 text-purple-800",
  REPORT_DRAFT: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
};

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Paid", value: "PAID" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Report Draft", value: "REPORT_DRAFT" },
  { label: "Completed", value: "COMPLETED" },
];

const TIER_OPTIONS = [
  { label: "All Tiers", value: "" },
  { label: "Standard", value: "STANDARD" },
  { label: "Complex", value: "COMPLEX" },
  { label: "Oncology", value: "ONCOLOGY" },
];

function formatTier(tier: string): string {
  const map: Record<string, string> = {
    STANDARD: "Standard",
    COMPLEX: "Complex",
    ONCOLOGY: "Oncology",
  };
  return map[tier] ?? tier;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SecondOpinionCoordinatorPage() {
  const router = useRouter();

  // Data
  const [cases, setCases] = useState<SecondOpinionCase[]>([]);
  const [counts, setCounts] = useState<CaseCounts>({
    SUBMITTED: 0,
    PAID: 0,
    ASSIGNED: 0,
    IN_REVIEW: 0,
    REPORT_DRAFT: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    REFUNDED: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // UI
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, tierFilter]);

  // Fetch cases
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (tierFilter) params.set("tier", tierFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));

      const res = await fetch(
        `/api/admin/second-opinion?${params.toString()}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data: ApiResponse = await res.json();
        setCases(data.cases);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCounts(data.counts);
      }
    } catch {
      console.error("Failed to fetch second opinion cases");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tierFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Derived totals for summary cards
  const totalCases = Object.values(counts).reduce((a, b) => a + b, 0);
  const awaitingPayment = counts.SUBMITTED;
  const paidUnassigned = counts.PAID;
  const inReview = counts.IN_REVIEW + counts.ASSIGNED + counts.REPORT_DRAFT;
  const completed = counts.COMPLETED;

  const summaryCards = [
    {
      label: "Total Cases",
      value: totalCases,
      icon: FileText,
      color: "bg-[#0D1F3C]",
      iconColor: "text-white",
    },
    {
      label: "Awaiting Payment",
      value: awaitingPayment,
      icon: Clock,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Paid (Unassigned)",
      value: paidUnassigned,
      icon: CreditCard,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "In Review",
      value: inReview,
      icon: UserCheck,
      color: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "bg-green-50",
      iconColor: "text-green-600",
    },
  ];

  return (
    <DashboardLayout title="Second Opinion Coordinator">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            Second Opinion Cases
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage second opinion requests, assign specialists, and track
            reports.
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Summary Cards                                                     */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const isNavy = card.color === "bg-[#0D1F3C]";
            return (
              <div
                key={card.label}
                className={`rounded-xl border p-4 ${card.color} ${
                  isNavy ? "border-transparent" : "border-gray-200"
                }`}
                style={isNavy ? { backgroundColor: "#0D1F3C" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isNavy ? "text-white/70" : card.iconColor
                    }`}
                  />
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        isNavy ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {card.label}
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        isNavy ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Filter Bar                                                        */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-3">
          {/* Status tabs */}
          <div className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    active ? { backgroundColor: "#0A4A50" } : undefined
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search + tier filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, patient name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-[#0A4A50] focus:outline-none focus:ring-1 focus:ring-[#0A4A50]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-[#0A4A50] focus:outline-none focus:ring-1 focus:ring-[#0A4A50]"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Loading state                                                     */}
        {/* ----------------------------------------------------------------- */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading cases...
            </span>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Empty state                                                       */}
        {/* ----------------------------------------------------------------- */}
        {!loading && cases.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No cases found matching your filters.
            </p>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Desktop table (hidden on mobile)                                  */}
        {/* ----------------------------------------------------------------- */}
        {!loading && cases.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Reference",
                      "Patient",
                      "Specialty",
                      "Tier",
                      "Status",
                      "Assigned To",
                      "Created",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() =>
                        router.push(`/admin/second-opinion/${c.id}`)
                      }
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {c.reference}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {c.patientName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {c.specialty}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {formatTier(c.tier)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatStatus(c.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {c.specialist?.user?.name ?? (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/second-opinion/${c.id}`);
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#0A4A50] hover:bg-[#0A4A50]/10"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Mobile card layout                                             */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-3 md:hidden">
              {cases.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    router.push(`/admin/second-opinion/${c.id}`)
                  }
                  className="w-full rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.reference}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {c.patientName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatStatus(c.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                      {c.specialty}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                      {formatTier(c.tier)}
                    </span>
                    {c.specialist?.user?.name && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                        {c.specialist.user.name}
                      </span>
                    )}
                    <span className="ml-auto">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Pagination                                                     */}
            {/* ------------------------------------------------------------- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Showing page {page} of {totalPages} ({total} case
                  {total !== 1 ? "s" : ""})
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
