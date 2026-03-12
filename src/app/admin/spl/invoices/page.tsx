"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Loader2,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Filter,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SPLInvoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  partnerId: string;
  periodStart: string;
  periodEnd: string;
  caseCount: number;
  subtotal: string;
  dfcFee: string;
  total: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  contract: {
    partner: { name: string; shortName: string };
  };
}

interface SPLPartner {
  id: string;
  name: string;
  shortName: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-700",
};

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

export default function SPLInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SPLInvoice[]>([]);
  const [partners, setPartners] = useState<SPLPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters
  const [partnerFilter, setPartnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (partnerFilter) params.set("partnerId", partnerFilter);
        if (statusFilter) params.set("status", statusFilter);

        const [invoicesRes, partnersRes] = await Promise.all([
          fetch(`/api/admin/spl/invoices?${params.toString()}`, {
            credentials: "include",
          }),
          fetch("/api/admin/spl/partners", { credentials: "include" }),
        ]);

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices);
        }
        if (partnersRes.ok) {
          const data = await partnersRes.json();
          setPartners(data.partners);
        }
      } catch {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partnerFilter, statusFilter]);

  const handleMarkPaid = async (invoiceId: string) => {
    setUpdating(invoiceId);
    try {
      const res = await fetch(`/api/admin/spl/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv))
        );
      }
    } catch {
      console.error("Failed to mark invoice as paid");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <DashboardLayout title="SPL Invoices">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/admin/spl")}
            className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to SPL
          </button>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Invoice management and payment tracking.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
            >
              <option value="">All Partners</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading invoices...
            </span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <Receipt className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No invoices found.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Invoice #",
                      "Partner",
                      "Period",
                      "Cases",
                      "Amount",
                      "Status",
                      "Due Date",
                      "Actions",
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
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {inv.contract.partner.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(inv.periodStart).toLocaleDateString()} -{" "}
                        {new Date(inv.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {inv.caseCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE[inv.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {(inv.status === "SENT" ||
                          inv.status === "OVERDUE") && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            disabled={updating === inv.id}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            {updating === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Mark Paid
                          </button>
                        )}
                        {inv.status === "PAID" && inv.paidAt && (
                          <span className="text-xs text-gray-400">
                            Paid{" "}
                            {new Date(inv.paidAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {inv.invoiceNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {inv.contract.partner.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[inv.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>{inv.caseCount} cases</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(inv.total)}
                    </span>
                    <span>
                      Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  {(inv.status === "SENT" || inv.status === "OVERDUE") && (
                    <button
                      onClick={() => handleMarkPaid(inv.id)}
                      disabled={updating === inv.id}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 disabled:opacity-50"
                    >
                      {updating === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Mark as Paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
