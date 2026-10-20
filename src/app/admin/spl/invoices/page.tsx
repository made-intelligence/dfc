"use client";

import { useState, useEffect, useCallback, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "@/lib/navigation";
import {
  Loader2,
  Receipt,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Plus,
  Send,
  X,
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

interface SPLContract {
  id: string;
  title: string;
  status: string;
  partner: { name: string; shortName: string };
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

const selectClass =
  "appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]";
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]";

function formatCurrency(val: string | number | null) {
  if (val === null || val === undefined) return "--";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(val));
}

function formatDate(val: string) {
  return new Date(val).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SPLInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<SPLInvoice[]>([]);
  const [partners, setPartners] = useState<SPLPartner[]>([]);
  const [contracts, setContracts] = useState<SPLContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [partnerFilter, setPartnerFilter] = useState(searchParams.get("partnerId") ?? "");
  const [statusFilter, setStatusFilter] = useState("");

  // Generate-invoice panel (opened directly from a case via ?contractId=)
  const [showGenerate, setShowGenerate] = useState(!!searchParams.get("contractId"));
  const [genContract, setGenContract] = useState(searchParams.get("contractId") ?? "");
  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (partnerFilter) params.set("partnerId", partnerFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/spl/invoices?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [partnerFilter, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/spl/partners", { credentials: "include" }),
      fetch("/api/admin/spl/contracts", { credentials: "include" }),
    ])
      .then(async ([partnersRes, contractsRes]) => {
        if (partnersRes.ok) setPartners((await partnersRes.json()).partners);
        if (contractsRes.ok) setContracts((await contractsRes.json()).contracts);
      })
      .catch(() => setError("Failed to load partners and contracts"));
  }, []);

  const setInvoiceStatus = async (invoiceId: string, status: "SENT" | "PAID") => {
    setUpdating(invoiceId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/spl/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update the invoice");
      const data = await res.json();
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the invoice");
    } finally {
      setUpdating(null);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/spl/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contractId: genContract,
          periodStart: genFrom || undefined,
          periodEnd: genTo || undefined,
          notes: genNotes || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to generate the invoice");
      setShowGenerate(false);
      setGenFrom("");
      setGenTo("");
      setGenNotes("");
      await fetchInvoices();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate the invoice");
    } finally {
      setGenerating(false);
    }
  };

  const renderActions = (inv: SPLInvoice, compact: boolean) => {
    const busy = updating === inv.id;
    const base = compact
      ? "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50"
      : "mt-3 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50";
    if (inv.status === "DRAFT") {
      return (
        <button
          onClick={() => setInvoiceStatus(inv.id, "SENT")}
          disabled={busy}
          className={`${base} text-[#0A6E75] hover:bg-[#0A6E75]/5 ${compact ? "" : "border-[#0A6E75]/30"}`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Mark Sent
        </button>
      );
    }
    if (inv.status === "SENT" || inv.status === "OVERDUE") {
      return (
        <button
          onClick={() => setInvoiceStatus(inv.id, "PAID")}
          disabled={busy}
          className={`${base} text-green-700 hover:bg-green-50 ${compact ? "" : "border-green-200 bg-green-50"}`}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Mark Paid
        </button>
      );
    }
    if (inv.status === "PAID" && inv.paidAt) {
      return <span className="text-xs text-gray-400">Paid {formatDate(inv.paidAt)}</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            onClick={() => router.push("/admin/spl")}
            className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to SPL
          </button>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Bill delivered cases and track payment.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D1F3C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162d52]"
        >
          <Plus className="h-4 w-4" />
          Generate Invoice
        </button>
      </div>

      {/* Generate panel */}
      {showGenerate && (
        <form
          onSubmit={handleGenerate}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Generate invoice</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Bills every delivered case on the contract that is not on an invoice yet. Leave the
                dates empty to include all of them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label htmlFor="gen-contract" className="mb-1 block text-xs font-medium text-gray-600">
                Contract
              </label>
              <select
                id="gen-contract"
                value={genContract}
                onChange={(e) => setGenContract(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select a contract</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.partner.shortName} — {c.title}
                    {c.status !== "ACTIVE" ? ` (${c.status.toLowerCase()})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gen-from" className="mb-1 block text-xs font-medium text-gray-600">
                Delivered from
              </label>
              <input
                id="gen-from"
                type="date"
                value={genFrom}
                onChange={(e) => setGenFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="gen-to" className="mb-1 block text-xs font-medium text-gray-600">
                Delivered to
              </label>
              <input
                id="gen-to"
                type="date"
                value={genTo}
                onChange={(e) => setGenTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="gen-notes" className="mb-1 block text-xs font-medium text-gray-600">
                Notes (optional)
              </label>
              <input
                id="gen-notes"
                type="text"
                value={genNotes}
                onChange={(e) => setGenNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {genError && <p className="text-sm text-red-600">{genError}</p>}
          <button
            type="submit"
            disabled={generating || !genContract}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#085C62] disabled:opacity-50"
          >
            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create draft invoice
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className={selectClass}
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
            className={selectClass}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading invoices...</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <Receipt className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No invoices found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Invoice #", "Partner", "Period", "Cases", "Amount", "Status", "Due Date", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {inv.contract.partner.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
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
                          STATUS_BADGE[inv.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{renderActions(inv, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{inv.contract.partner.name}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_BADGE[inv.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>{inv.caseCount} cases</span>
                  <span className="font-medium text-gray-900">{formatCurrency(inv.total)}</span>
                  <span>Due: {formatDate(inv.dueDate)}</span>
                </div>
                {renderActions(inv, false)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SPLInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <SPLInvoicesContent />
    </Suspense>
  );
}
