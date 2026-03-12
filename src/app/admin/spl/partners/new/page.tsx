"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Loader2, Building } from "lucide-react";

const PARTNER_TYPES = [
  { label: "HMO", value: "HMO" },
  { label: "Corporate", value: "CORPORATE" },
  { label: "Government", value: "GOVERNMENT" },
  { label: "Insurer", value: "INSURER" },
];

export default function NewPartnerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    type: "CORPORATE",
    primaryContact: "",
    primaryEmail: "",
    primaryPhone: "",
    rcNumber: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.shortName || !form.primaryEmail) {
      setError("Name, short name, and primary email are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/spl/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/spl/partners");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create partner.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="New Partner">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/admin/spl/partners")}
            className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Partners
          </button>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            New Partner
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new SPL partner organization.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#0A6E75" }}
            >
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Partner Details
              </h2>
              <p className="text-xs text-gray-500">
                Fields marked with * are required.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="e.g. HygeiaHMO Nigeria Ltd"
              />
            </div>

            {/* Short Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name *
              </label>
              <input
                type="text"
                required
                value={form.shortName}
                onChange={(e) => updateField("shortName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="e.g. Hygeia"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                value={form.primaryContact}
                onChange={(e) => updateField("primaryContact", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="Contact person name"
              />
            </div>

            {/* Primary Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Email *
              </label>
              <input
                type="email"
                required
                value={form.primaryEmail}
                onChange={(e) => updateField("primaryEmail", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="partners@example.com"
              />
            </div>

            {/* Primary Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone
              </label>
              <input
                type="tel"
                value={form.primaryPhone}
                onChange={(e) => updateField("primaryPhone", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="+234..."
              />
            </div>

            {/* RC Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RC Number (CAC)
              </label>
              <input
                type="text"
                value={form.rcNumber}
                onChange={(e) => updateField("rcNumber", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0A6E75] focus:outline-none focus:ring-1 focus:ring-[#0A6E75]"
                placeholder="CAC registration number"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/spl/partners")}
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
              Create Partner
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
