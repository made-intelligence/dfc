"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams } from "@/lib/navigation";
import Link from "next/link";
import { ArrowLeft, Building, FileText, Loader2, Receipt, Users } from "lucide-react";

interface PartnerContract {
  id: string;
  title: string;
  model: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface PartnerCase {
  id: string;
  referenceNumber: string;
  patientName: string;
  specialty: string;
  status: string;
  submittedAt: string;
}

interface PartnerDetail {
  id: string;
  name: string;
  shortName: string;
  type: string;
  status: string;
  primaryContact: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  rcNumber: string | null;
  createdAt: string;
  contracts: PartnerContract[];
  cases: PartnerCase[];
  adminUsers: { id: string; role: string; user: { id: string; name: string; email: string } }[];
  _count: { cases: number };
}

interface InvoiceTotal {
  status: string;
  _sum: { total: string | null };
  _count: number;
}

const STATUSES = ["DRAFT", "UNDER_REVIEW", "ACTIVE", "PAUSED", "EXPIRED", "TERMINATED"];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-700",
  TERMINATED: "bg-red-200 text-red-900",
  DELIVERED: "bg-green-100 text-green-800",
  BILLED: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]";

function label(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(val: string) {
  return new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(val: string | number | null) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(val ?? 0));
}

export default function SPLPartnerDetailPage() {
  const params = useParams();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [invoiceTotals, setInvoiceTotals] = useState<InvoiceTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    primaryContact: "",
    primaryEmail: "",
    primaryPhone: "",
    rcNumber: "",
  });

  const fetchPartner = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/spl/partners/${partnerId}`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to load the partner");
      setPartner(data.partner);
      setInvoiceTotals(data.invoiceTotals ?? []);
      setForm({
        primaryContact: data.partner.primaryContact ?? "",
        primaryEmail: data.partner.primaryEmail ?? "",
        primaryPhone: data.partner.primaryPhone ?? "",
        rcNumber: data.partner.rcNumber ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the partner");
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  const save = async (body: Record<string, string>) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/spl/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      await fetchPartner();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    save(form);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-4">
        <Link href="/admin/spl/partners" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to partners
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">{error || "Partner not found"}</p>
      </div>
    );
  }

  const outstanding = invoiceTotals
    .filter((t) => t.status === "SENT" || t.status === "OVERDUE")
    .reduce((sum, t) => sum + Number(t._sum.total ?? 0), 0);
  const paid = invoiceTotals
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + Number(t._sum.total ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/spl/partners" className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to partners
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0A6E75]/10">
              <Building className="h-5 w-5 text-[#0A6E75]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0D1F3C]">{partner.name}</h1>
              <p className="text-sm text-gray-500">
                {partner.shortName} · {label(partner.type)} · since {formatDate(partner.createdAt)}
              </p>
            </div>
          </div>
          <select
            value={partner.status}
            onChange={(e) => save({ status: e.target.value })}
            disabled={saving}
            aria-label="Change partner status"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75] disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "Cases submitted", value: String(partner._count.cases) },
          { name: "Outstanding", value: formatCurrency(outstanding) },
          { name: "Paid to date", value: formatCurrency(paid) },
        ].map((s) => (
          <div key={s.name} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">{s.name}</p>
            <p className="mt-1 text-2xl font-bold text-[#0D1F3C]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contracts */}
          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 px-5 py-4">
              <FileText className="h-4 w-4 text-[#0A6E75]" />
              <h2 className="text-sm font-semibold text-gray-900">Contracts</h2>
            </div>
            {partner.contracts.length === 0 ? (
              <p className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">
                No contracts yet.{" "}
                <Link href="/admin/spl/contracts" className="font-medium text-[#0A6E75] hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {partner.contracts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/admin/spl/contracts/${c.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{c.title}</p>
                        <p className="text-gray-500">
                          {label(c.model)} · {formatDate(c.startDate)} – {formatDate(c.endDate)}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {label(c.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent cases */}
          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[#0A6E75]" />
                <h2 className="text-sm font-semibold text-gray-900">Recent cases</h2>
              </div>
              <Link href={`/admin/spl/invoices?partnerId=${partner.id}`} className="text-sm font-medium text-[#0A6E75] hover:underline">
                Invoices
              </Link>
            </div>
            {partner.cases.length === 0 ? (
              <p className="border-t border-gray-100 px-5 py-6 text-sm text-gray-500">No cases yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {partner.cases.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{c.referenceNumber}</p>
                      <p className="text-gray-500">
                        {c.patientName} · {c.specialty} · {formatDate(c.submittedAt)}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {label(c.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Contact details */}
          <form onSubmit={handleContactSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">Contact details</h2>
            {(
              [
                ["primaryContact", "Primary contact", "text"],
                ["primaryEmail", "Email", "email"],
                ["primaryPhone", "Phone", "tel"],
                ["rcNumber", "CAC RC number", "text"],
              ] as const
            ).map(([key, name, type]) => (
              <div key={key}>
                <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
                  {name}
                </label>
                <input
                  id={key}
                  type={type}
                  value={form[key]}
                  onChange={(e) => {
                    setSaved(false);
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                  }}
                  className={inputClass}
                />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A6E75] px-4 py-2 text-sm font-medium text-white hover:bg-[#085C62] disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
              {saved && <span className="text-xs text-green-600">Saved</span>}
            </div>
          </form>

          {/* Portal users */}
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="h-4 w-4 text-[#0A6E75]" />
              Portal users
            </h2>
            {partner.adminUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No one from this partner can sign in yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {partner.adminUsers.map((u) => (
                  <li key={u.id}>
                    <p className="font-medium text-gray-900">{u.user.name}</p>
                    <p className="text-gray-500">
                      {u.user.email} · {label(u.role)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
