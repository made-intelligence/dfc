"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Users, Layers } from "lucide-react";

interface Initiative {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  remit: string | null;
  expectedOutputs: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count: { members: number; pillars: number };
}

const TYPE_LABELS: Record<string, string> = {
  TWG: "TWG",
  TASK_FORCE: "Task Force",
  COMMITTEE: "Committee",
  PROJECT: "Project",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  TWG: "bg-blue-100 text-blue-800",
  TASK_FORCE: "bg-purple-100 text-purple-800",
  COMMITTEE: "bg-teal-100 text-teal-800",
  PROJECT: "bg-amber-100 text-amber-800",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const INITIATIVE_TYPES = ["TWG", "TASK_FORCE", "COMMITTEE", "PROJECT"] as const;
const INITIATIVE_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;

export default function AdminInitiativesPage() {
  const router = useRouter();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("TWG");
  const [formStatus, setFormStatus] = useState<string>("DRAFT");
  const [formDescription, setFormDescription] = useState("");
  const [formRemit, setFormRemit] = useState("");
  const [formExpectedOutputs, setFormExpectedOutputs] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const fetchInitiatives = useCallback(async () => {
    try {
      const typeParam = activeFilter !== "ALL" ? `?type=${activeFilter}` : "";
      const res = await fetch(`/api/admin/initiatives${typeParam}`);
      const data = await res.json();
      if (data.success) {
        setInitiatives(data.initiatives);
      }
    } catch {
      console.error("Failed to fetch initiatives");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchInitiatives();
  }, [fetchInitiatives]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function openCreateModal() {
    setFormName("");
    setFormType("TWG");
    setFormStatus("DRAFT");
    setFormDescription("");
    setFormRemit("");
    setFormExpectedOutputs("");
    setFormStartDate("");
    setFormEndDate("");
    setShowModal(true);
  }

  async function handleCreate() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          type: formType,
          status: formStatus,
          description: formDescription || null,
          remit: formRemit || null,
          expectedOutputs: formExpectedOutputs || null,
          startDate: formStartDate || null,
          endDate: formEndDate || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: "success", message: "Initiative created successfully." });
        setShowModal(false);
        fetchInitiatives();
      } else {
        setToast({ type: "error", message: data.error || "Failed to create initiative." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove all pillars and member assignments.`)) return;
    try {
      const res = await fetch(`/api/admin/initiatives?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Initiative deleted." });
        fetchInitiatives();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to delete." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  const filterTabs = [
    { key: "ALL", label: "All" },
    { key: "TWG", label: "TWG" },
    { key: "TASK_FORCE", label: "Task Force" },
    { key: "COMMITTEE", label: "Committee" },
    { key: "PROJECT", label: "Project" },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-10 bg-gray-200 rounded w-96" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committees & Initiatives</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage DFC technical working groups, task forces, committees, and projects.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg hover:bg-[#0D1F3C]/90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Initiative
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {initiatives.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No initiatives found.</p>
          <p className="text-sm text-gray-400 mt-1">Create one using the button above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pillars
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Members
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Created
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initiatives.map((ini) => (
                <tr
                  key={ini.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/initiatives/${ini.id}`)}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{ini.name}</p>
                    {ini.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ini.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        TYPE_BADGE_COLORS[ini.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {TYPE_LABELS[ini.type] || ini.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        STATUS_BADGE_COLORS[ini.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[ini.status] || ini.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Layers className="w-3.5 h-3.5" />
                      {ini._count.pillars}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5" />
                      {ini._count.members}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(ini.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/initiatives/${ini.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#0A4A50] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(ini.id, ini.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Initiative</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. TWG on Workforce Policy"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
              />
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                >
                  {INITIATIVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                >
                  {INITIATIVE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the initiative..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
              />
            </div>

            {/* Remit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remit / Mandate</label>
              <textarea
                value={formRemit}
                onChange={(e) => setFormRemit(e.target.value)}
                rows={2}
                placeholder="Written mandate or terms of reference..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
              />
            </div>

            {/* Expected Outputs */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outputs</label>
              <textarea
                value={formExpectedOutputs}
                onChange={(e) => setFormExpectedOutputs(e.target.value)}
                rows={2}
                placeholder="Key deliverables and outputs..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !formName.trim()}
                className="flex-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Creating..." : "Create Initiative"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
