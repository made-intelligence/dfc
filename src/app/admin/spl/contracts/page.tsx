"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Loader2,
  FileText,
  Plus,
  ArrowLeft,
  X,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SPLPartner {
  id: string;
  name: string;
  shortName: string;
}

interface SPLContract {
  id: string;
  partnerId: string;
  model: string;
  status: string;
  title: string;
  description: string | null;
  specialties: string[] | null;
  serviceTypes: string[] | null;
  dfcPlatformFeePercent: string;
  feeSchedule: Record<string, number> | null;
  subscriptionFeeMonthly: string | null;
  subscribedVolume: number | null;
  subscriptionPeriod: string | null;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  casesDeliveredThisPeriod: number;
  partner: { name: string; shortName: string };
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-700",
  TERMINATED: "bg-red-200 text-red-900",
};

const MODEL_LABELS: Record<string, string> = {
  FEE_FOR_SERVICE: "Fee for Service",
  SUBSCRIPTION: "Subscription",
  HYBRID: "Hybrid",
};

const SERVICE_TYPE_OPTIONS = [
  "SECOND_OPINION",
  "SPECIALIST_CONSULTATION",
  "SURGICAL_REVIEW",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SPLContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<SPLContract[]>([]);
  const [partners, setPartners] = useState<SPLPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    partnerId: "",
    model: "FEE_FOR_SERVICE",
    title: "",
    description: "",
    specialties: "",
    serviceTypes: [] as string[],
    dfcPlatformFeePercent: "15",
    feeSchedule: [{ serviceType: "", rate: "" }],
    subscriptionFeeMonthly: "",
    subscribedVolume: "",
    subscriptionPeriod: "MONTHLY",
    startDate: "",
    endDate: "",
    autoRenew: false,
  });

  // Fetch contracts and partners
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsRes, partnersRes] = await Promise.all([
          fetch("/api/admin/spl/contracts", { credentials: "include" }),
          fetch("/api/admin/spl/partners", { credentials: "include" }),
        ]);

        if (contractsRes.ok) {
          const data = await contractsRes.json();
          setContracts(data.contracts);
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
  }, []);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleServiceType = (st: string) => {
    setForm((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(st)
        ? prev.serviceTypes.filter((s) => s !== st)
        : [...prev.serviceTypes, st],
    }));
  };

  const updateFeeRow = (idx: number, field: string, value: string) => {
    setForm((prev) => {
      const newSchedule = [...prev.feeSchedule];
      newSchedule[idx] = { ...newSchedule[idx], [field]: value };
      return { ...prev, feeSchedule: newSchedule };
    });
  };

  const addFeeRow = () => {
    setForm((prev) => ({
      ...prev,
      feeSchedule: [...prev.feeSchedule, { serviceType: "", rate: "" }],
    }));
  };

  const removeFeeRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      feeSchedule: prev.feeSchedule.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partnerId || !form.title || !form.startDate || !form.endDate) {
      setError("Partner, title, start date, and end date are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Build fee schedule object
      const feeScheduleObj: Record<string, number> = {};
      for (const row of form.feeSchedule) {
        if (row.serviceType && row.rate) {
          feeScheduleObj[row.serviceType] = Number(row.rate);
        }
      }

      const payload = {
        partnerId: form.partnerId,
        model: form.model,
        title: form.title,
        description: form.description || null,
        specialties: form.specialties
          ? form.specialties.split(",").map((s) => s.trim())
          : null,
        serviceTypes:
          form.serviceTypes.length > 0 ? form.serviceTypes : null,
        dfcPlatformFeePercent: Number(form.dfcPlatformFeePercent),
        feeSchedule:
          Object.keys(feeScheduleObj).length > 0 ? feeScheduleObj : null,
        subscriptionFeeMonthly:
          form.model !== "FEE_FOR_SERVICE" && form.subscriptionFeeMonthly
            ? Number(form.subscriptionFeeMonthly)
            : null,
        subscribedVolume:
          form.model !== "FEE_FOR_SERVICE" && form.subscribedVolume
            ? Number(form.subscribedVolume)
            : null,
        subscriptionPeriod:
          form.model !== "FEE_FOR_SERVICE" ? form.subscriptionPeriod : null,
        startDate: form.startDate,
        endDate: form.endDate,
        autoRenew: form.autoRenew,
      };

      const res = await fetch("/api/admin/spl/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setContracts((prev) => [data.contract, ...prev]);
        setShowForm(false);
        setForm({
          partnerId: "",
          model: "FEE_FOR_SERVICE",
          title: "",
          description: "",
          specialties: "",
          serviceTypes: [],
          dfcPlatformFeePercent: "15",
          feeSchedule: [{ serviceType: "", rate: "" }],
          subscriptionFeeMonthly: "",
          subscribedVolume: "",
          subscriptionPeriod: "MONTHLY",
          startDate: "",
          endDate: "",
          autoRenew: false,
        });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create contract.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="SPL Contracts">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              Contracts
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage partner contracts.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0A6E75" }}
          >
            {showForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </>
            )}
          </button>
        </div>

        {/* New Contract Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
          >
            <h2 className="text-base font-semibold text-gray-900">
              New Contract
            </h2>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Partner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partner *
                </label>
                <select
                  value={form.partnerId}
                  onChange={(e) => updateField("partnerId", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                >
                  <option value="">Select partner...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Model *
                </label>
                <select
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                >
                  <option value="FEE_FOR_SERVICE">Fee for Service</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                  placeholder="Contract title"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                  placeholder="Optional description"
                />
              </div>

              {/* Specialties */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialties (comma separated)
                </label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) => updateField("specialties", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                  placeholder="e.g. Cardiology, Oncology, Neurology"
                />
              </div>

              {/* Service Types */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Types
                </label>
                <div className="flex flex-wrap gap-3">
                  {SERVICE_TYPE_OPTIONS.map((st) => (
                    <label
                      key={st}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.serviceTypes.includes(st)}
                        onChange={() => toggleServiceType(st)}
                        className="h-4 w-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                      />
                      {st.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </div>

              {/* DFC Platform Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DFC Platform Fee %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.dfcPlatformFeePercent}
                  onChange={(e) =>
                    updateField("dfcPlatformFeePercent", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                />
              </div>

              {/* Fee Schedule */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Schedule (Service Type and Rate in NGN)
                </label>
                <div className="space-y-2">
                  {form.feeSchedule.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.serviceType}
                        onChange={(e) =>
                          updateFeeRow(idx, "serviceType", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                        placeholder="Service type"
                      />
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(e) =>
                          updateFeeRow(idx, "rate", e.target.value)
                        }
                        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                        placeholder="Rate (NGN)"
                      />
                      {form.feeSchedule.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeeRow(idx)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeeRow}
                    className="text-xs font-medium text-[#0A6E75] hover:underline"
                  >
                    + Add row
                  </button>
                </div>
              </div>

              {/* Subscription fields (shown for SUBSCRIPTION and HYBRID) */}
              {(form.model === "SUBSCRIPTION" || form.model === "HYBRID") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Fee (NGN)
                    </label>
                    <input
                      type="number"
                      value={form.subscriptionFeeMonthly}
                      onChange={(e) =>
                        updateField("subscriptionFeeMonthly", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contracted Volume
                    </label>
                    <input
                      type="number"
                      value={form.subscribedVolume}
                      onChange={(e) =>
                        updateField("subscribedVolume", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subscription Period
                    </label>
                    <select
                      value={form.subscriptionPeriod}
                      onChange={(e) =>
                        updateField("subscriptionPeriod", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  </div>
                </>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                />
              </div>

              {/* Auto-renew */}
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.autoRenew}
                    onChange={(e) => updateField("autoRenew", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
                  />
                  Auto-renew contract
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#0A6E75" }}
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Contract
              </button>
            </div>
          </form>
        )}

        {/* Contracts Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading contracts...
            </span>
          </div>
        ) : contracts.length === 0 && !showForm ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No contracts found. Create your first contract.
            </p>
          </div>
        ) : contracts.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Title",
                      "Partner",
                      "Model",
                      "Status",
                      "Start",
                      "End",
                      "Volume",
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
                  {contracts.map((c) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {c.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {c.partner.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {MODEL_LABELS[c.model] ?? c.model}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE[c.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(c.startDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {c.casesDeliveredThisPeriod}
                        {c.subscribedVolume
                          ? ` / ${c.subscribedVolume}`
                          : ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          onClick={() =>
                            router.push(`/admin/spl/contracts/${c.id}`)
                          }
                          className="text-xs font-medium text-[#0A6E75] hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {contracts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/admin/spl/contracts/${c.id}`)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {c.partner.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5">
                      {MODEL_LABELS[c.model] ?? c.model}
                    </span>
                    <span>
                      {new Date(c.startDate).toLocaleDateString()} -{" "}
                      {new Date(c.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
