"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "@/lib/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Receipt, ExternalLink } from "lucide-react";

interface ContractCase {
  id: string;
  referenceNumber: string;
  patientName: string;
  specialty: string;
  serviceType: string;
  status: string;
  agreedFee: string | null;
  submittedAt: string;
  deliveredAt: string | null;
}

interface ContractInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string;
  caseCount: number;
  dueDate: string;
}

interface ContractDetail {
  id: string;
  title: string;
  description: string | null;
  model: string;
  status: string;
  currency: string;
  specialties: string[] | null;
  serviceTypes: string[] | null;
  feeSchedule: Record<string, number> | null;
  subscriptionFeeMonthly: string | null;
  subscribedVolume: number | null;
  subscriptionPeriod: string | null;
  dfcPlatformFeePercent: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalNoticeDays: number;
  contractUrl: string | null;
  contractSignedAt: string | null;
  partner: { id: string; name: string; shortName: string };
  cases: ContractCase[];
  invoices: ContractInvoice[];
  _count: { cases: number };
}

const CONTRACT_STATUSES = ["DRAFT", "UNDER_REVIEW", "ACTIVE", "PAUSED", "EXPIRED", "TERMINATED"];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-700",
  TERMINATED: "bg-red-200 text-red-900",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-700",
  DELIVERED: "bg-green-100 text-green-800",
  BILLED: "bg-amber-100 text-amber-800",
};

function formatCurrency(val: string | number | null) {
  if (val === null || val === undefined) return "--";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(val));
}

function formatDate(val: string | null) {
  if (!val) return "--";
  return new Date(val).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function label(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{name}</p>
      <div className="mt-0.5 text-sm text-gray-900">{children}</div>
    </div>
  );
}

export default function SPLContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/spl/contracts/${contractId}`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to load the contract");
      setContract(data.contract);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the contract");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const changeStatus = async (status: string) => {
    if (!contract || status === contract.status) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/spl/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update the status");
      await fetchContract();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/spl/contracts"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to contracts
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Contract not found"}
        </p>
      </div>
    );
  }

  const fees = contract.feeSchedule ? Object.entries(contract.feeSchedule) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/spl/contracts"
          className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to contracts
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F3C]">{contract.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              <Link
                href={`/admin/spl/partners/${contract.partner.id}`}
                className="font-medium text-[#0A6E75] hover:underline"
              >
                {contract.partner.name}
              </Link>{" "}
              · {label(contract.model)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_BADGE[contract.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {label(contract.status)}
            </span>
            <select
              value={contract.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={saving}
              aria-label="Change contract status"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75] disabled:opacity-50"
            >
              {CONTRACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Terms */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Terms</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field name="Term">
            {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
          </Field>
          <Field name="Auto-renew">
            {contract.autoRenew ? `Yes (${contract.renewalNoticeDays} days notice)` : "No"}
          </Field>
          <Field name="DFC platform fee">{Number(contract.dfcPlatformFeePercent)}%</Field>
          <Field name="Signed">{formatDate(contract.contractSignedAt)}</Field>
          {contract.subscriptionFeeMonthly && (
            <Field name="Subscription">
              {formatCurrency(contract.subscriptionFeeMonthly)} / month
              {contract.subscribedVolume ? ` · ${contract.subscribedVolume} cases` : ""}
            </Field>
          )}
          <Field name="Specialties">
            {contract.specialties?.length ? contract.specialties.join(", ") : "All"}
          </Field>
          <Field name="Services">
            {contract.serviceTypes?.length ? contract.serviceTypes.map(label).join(", ") : "--"}
          </Field>
          {contract.contractUrl && (
            <Field name="Document">
              <a
                href={contract.contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#0A6E75] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open contract
              </a>
            </Field>
          )}
        </div>
        {fees.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Fee schedule
            </p>
            <div className="flex flex-wrap gap-2">
              {fees.map(([service, fee]) => (
                <span key={service} className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  {label(service)}: <span className="font-medium">{formatCurrency(fee)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {contract.description && (
          <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-600">
            {contract.description}
          </p>
        )}
      </section>

      {/* Cases */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-4">
          <FileText className="h-4 w-4 text-[#0A6E75]" />
          <h2 className="text-sm font-semibold text-gray-900">
            Cases ({contract._count.cases})
          </h2>
        </div>
        {contract.cases.length === 0 ? (
          <p className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">
            No cases on this contract yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {contract.cases.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{c.referenceNumber}</p>
                  <p className="text-gray-500">
                    {c.patientName} · {c.specialty}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">{formatCurrency(c.agreedFee)}</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {label(c.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invoices */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#0A6E75]" />
            <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          </div>
          <Link
            href={`/admin/spl/invoices?contractId=${contract.id}`}
            className="text-sm font-medium text-[#0A6E75] hover:underline"
          >
            Generate invoice
          </Link>
        </div>
        {contract.invoices.length === 0 ? (
          <p className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">
            Nothing has been invoiced on this contract yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {contract.invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-gray-500">
                    {inv.caseCount} cases · due {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{formatCurrency(inv.total)}</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_BADGE[inv.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {label(inv.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
