"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  X,
  Users,
  Layers,
  UserPlus,
} from "lucide-react";

interface Pillar {
  id: string;
  name: string;
  subtitle: string | null;
  focus: string | null;
  outputs: string | null;
  order: number;
  _count: { members: number };
}

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  pillar: { id: string; name: string } | null;
  dfcMember: {
    id: string;
    memberNumber: string | null;
    user: { id: string; name: string; email: string; profileImage: string | null };
  };
}

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
  pillars: Pillar[];
  members: Member[];
  _count: { members: number; pillars: number };
}

interface SearchResult {
  id: string;
  userId: string;
  memberNumber: string | null;
  category: string;
  user: { name: string; email: string };
}

const TYPE_LABELS: Record<string, string> = {
  TWG: "TWG",
  TASK_FORCE: "Task Force",
  COMMITTEE: "Committee",
  PROJECT: "Project",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const ROLE_LABELS: Record<string, string> = {
  LEAD: "Lead",
  CO_LEAD: "Co-Lead",
  ADVISOR: "Advisor",
  MEMBER: "Member",
};

const INITIATIVE_TYPES = ["TWG", "TASK_FORCE", "COMMITTEE", "PROJECT"] as const;
const INITIATIVE_STATUSES = ["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const;
const MEMBER_ROLES = ["LEAD", "CO_LEAD", "ADVISOR", "MEMBER"] as const;

export default function InitiativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Initiative form fields
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("TWG");
  const [formStatus, setFormStatus] = useState("DRAFT");
  const [formDescription, setFormDescription] = useState("");
  const [formRemit, setFormRemit] = useState("");
  const [formExpectedOutputs, setFormExpectedOutputs] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  // Pillar form
  const [showPillarForm, setShowPillarForm] = useState(false);
  const [pillarName, setPillarName] = useState("");
  const [pillarSubtitle, setPillarSubtitle] = useState("");
  const [pillarFocus, setPillarFocus] = useState("");
  const [pillarOutputs, setPillarOutputs] = useState("");
  const [savingPillar, setSavingPillar] = useState(false);

  // Member add
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<SearchResult[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const [memberPillarId, setMemberPillarId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [savingMember, setSavingMember] = useState(false);

  const fetchInitiative = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/initiatives/${id}`);
      const data = await res.json();
      if (data.success) {
        setInitiative(data.initiative);
        populateForm(data.initiative);
      }
    } catch {
      console.error("Failed to fetch initiative");
    } finally {
      setLoading(false);
    }
  }, [id]);

  function populateForm(ini: Initiative) {
    setFormName(ini.name);
    setFormType(ini.type);
    setFormStatus(ini.status);
    setFormDescription(ini.description || "");
    setFormRemit(ini.remit || "");
    setFormExpectedOutputs(ini.expectedOutputs || "");
    setFormStartDate(ini.startDate ? ini.startDate.slice(0, 10) : "");
    setFormEndDate(ini.endDate ? ini.endDate.slice(0, 10) : "");
  }

  useEffect(() => {
    fetchInitiative();
  }, [fetchInitiative]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // --- Save initiative details ---
  async function handleSaveDetails() {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/initiatives", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
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
        setToast({ type: "success", message: "Initiative details saved." });
        fetchInitiative();
      } else {
        setToast({ type: "error", message: data.error || "Failed to save." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  // --- Pillars ---
  async function handleAddPillar() {
    if (!pillarName.trim()) return;
    setSavingPillar(true);
    try {
      const res = await fetch(`/api/admin/initiatives/${id}/pillars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pillarName,
          subtitle: pillarSubtitle || null,
          focus: pillarFocus || null,
          outputs: pillarOutputs || null,
          order: initiative ? initiative.pillars.length : 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: "success", message: "Pillar added." });
        setShowPillarForm(false);
        setPillarName("");
        setPillarSubtitle("");
        setPillarFocus("");
        setPillarOutputs("");
        fetchInitiative();
      } else {
        setToast({ type: "error", message: data.error || "Failed to add pillar." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSavingPillar(false);
    }
  }

  async function handleDeletePillar(pillarId: string, pillarNameStr: string) {
    if (!confirm(`Delete pillar "${pillarNameStr}"? Members assigned to this pillar will be unassigned.`)) return;
    try {
      const res = await fetch(`/api/admin/initiatives/${id}/pillars?pillarId=${pillarId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToast({ type: "success", message: "Pillar deleted." });
        fetchInitiative();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to delete pillar." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  // --- Members ---
  async function searchMembers(query: string) {
    if (query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    setMemberSearching(true);
    try {
      const res = await fetch(`/api/admin/exco/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setMemberSearchResults(data.results);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setMemberSearching(false);
    }
  }

  function openMemberForm() {
    setSelectedMember(null);
    setMemberSearchQuery("");
    setMemberSearchResults([]);
    setMemberPillarId("");
    setMemberRole("MEMBER");
    setShowMemberForm(true);
  }

  async function handleAddMember() {
    if (!selectedMember) return;
    setSavingMember(true);
    try {
      const res = await fetch(`/api/admin/initiatives/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dfcMemberId: selectedMember.id,
          pillarId: memberPillarId || null,
          role: memberRole,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ type: "success", message: "Member added to initiative." });
        setShowMemberForm(false);
        fetchInitiative();
      } else {
        setToast({ type: "error", message: data.error || "Failed to add member." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSavingMember(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from this initiative?`)) return;
    try {
      const res = await fetch(`/api/admin/initiatives/${id}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToast({ type: "success", message: "Member removed." });
        fetchInitiative();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to remove member." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Initiative not found.</p>
        <button
          onClick={() => router.push("/admin/initiatives")}
          className="mt-4 text-sm text-[#0A4A50] hover:underline"
        >
          Back to initiatives
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Back + Header */}
      <button
        onClick={() => router.push("/admin/initiatives")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to initiatives
      </button>

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

      {/* ========== SECTION 1: Initiative Details ========== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Initiative Details</h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
          />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
          />
        </div>

        {/* Remit */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remit / Mandate</label>
          <textarea
            value={formRemit}
            onChange={(e) => setFormRemit(e.target.value)}
            rows={3}
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
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

        <button
          onClick={handleSaveDetails}
          disabled={saving || !formName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Details"}
        </button>
      </div>

      {/* ========== SECTION 2: Pillars ========== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Pillars</h2>
            <span className="text-sm text-gray-400">({initiative.pillars.length})</span>
          </div>
          <button
            onClick={() => setShowPillarForm(!showPillarForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0D1F3C] border border-[#0D1F3C] rounded-lg hover:bg-[#0D1F3C]/5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pillar
          </button>
        </div>

        {/* Inline pillar form */}
        {showPillarForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pillarName}
                  onChange={(e) => setPillarName(e.target.value)}
                  placeholder="e.g. Policy Framework"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={pillarSubtitle}
                  onChange={(e) => setPillarSubtitle(e.target.value)}
                  placeholder="Optional subtitle"
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Focus Areas</label>
              <textarea
                value={pillarFocus}
                onChange={(e) => setPillarFocus(e.target.value)}
                rows={2}
                placeholder="Key focus areas for this pillar..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Outputs</label>
              <textarea
                value={pillarOutputs}
                onChange={(e) => setPillarOutputs(e.target.value)}
                rows={2}
                placeholder="Expected outputs from this pillar..."
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPillarForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPillar}
                disabled={savingPillar || !pillarName.trim()}
                className="px-3 py-1.5 text-sm font-medium bg-[#0D1F3C] text-white rounded-lg hover:bg-[#0D1F3C]/90 disabled:opacity-50"
              >
                {savingPillar ? "Saving..." : "Add Pillar"}
              </button>
            </div>
          </div>
        )}

        {/* Pillar list */}
        {initiative.pillars.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No pillars defined yet.</p>
        ) : (
          <div className="space-y-2">
            {initiative.pillars.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  {p.subtitle && <p className="text-xs text-gray-500 mt-0.5">{p.subtitle}</p>}
                  {p.focus && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.focus}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    {p._count.members} member{p._count.members !== 1 ? "s" : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePillar(p.id, p.name)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors ml-2 flex-shrink-0"
                  title="Delete pillar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== SECTION 3: Members ========== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            <span className="text-sm text-gray-400">({initiative.members.length})</span>
          </div>
          <button
            onClick={openMemberForm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0D1F3C] border border-[#0D1F3C] rounded-lg hover:bg-[#0D1F3C]/5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        </div>

        {/* Member table */}
        {initiative.members.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No members assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Pillar
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Joined
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initiative.members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {m.dfcMember.user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.dfcMember.user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {m.pillar?.name || <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.role === "LEAD"
                            ? "bg-[#0D1F3C] text-white"
                            : m.role === "CO_LEAD"
                            ? "bg-[#0A4A50] text-white"
                            : m.role === "ADVISOR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(m.joinedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.id, m.dfcMember.user.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== Add Member Modal ========== */}
      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Member</h2>
              <button
                onClick={() => setShowMemberForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search member</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value);
                    searchMembers(e.target.value);
                  }}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
              {memberSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              {memberSearchResults.length > 0 && !selectedMember && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {memberSearchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedMember(r);
                        setMemberSearchQuery(r.user.name);
                        setMemberSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900">{r.user.name}</p>
                      <p className="text-xs text-gray-500">{r.user.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedMember && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedMember.user.name}</p>
                    <p className="text-xs text-gray-500">{selectedMember.user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setMemberSearchQuery("");
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Pillar select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pillar (optional)</label>
              <select
                value={memberPillarId}
                onChange={(e) => setMemberPillarId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
              >
                <option value="">No specific pillar</option>
                {initiative.pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role select */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
              >
                {MEMBER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMemberForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={savingMember || !selectedMember}
                className="flex-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingMember ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
