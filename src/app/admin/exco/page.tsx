"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Plus, Pencil, Trash2, Search, X } from "lucide-react";

interface ExcoMember {
  id: string;
  userId: string;
  memberNumber: string | null;
  excoPosition: string;
  excoElectedAt: string | null;
  excoTermEnd: string | null;
  category: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
}

interface SearchResult {
  id: string;
  userId: string;
  memberNumber: string | null;
  category: string;
  user: { name: string; email: string };
}

const POSITION_LABELS: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY_GENERAL: "Secretary General",
  ASSISTANT_SECRETARY: "Assistant Secretary",
  TREASURER: "Treasurer",
  FINANCIAL_SECRETARY: "Financial Secretary",
  PRO: "Public Relations Officer",
  WELFARE: "Welfare Officer",
  PROVOST: "Provost",
  SOCIAL_SECRETARY: "Social Secretary",
  EX_OFFICIO: "Ex-Officio",
};

export default function AdminExcoPage() {
  const [excoMembers, setExcoMembers] = useState<ExcoMember[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ExcoMember | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchResult | null>(null);
  const [formPosition, setFormPosition] = useState("");
  const [formElectedAt, setFormElectedAt] = useState("");
  const [formTermEnd, setFormTermEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchExco = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/exco");
      const data = await res.json();
      if (data.success) {
        setExcoMembers(data.excoMembers);
        setPositions(data.positions);
      }
    } catch {
      console.error("Failed to fetch EXCO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExco();
  }, [fetchExco]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function searchMembers(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/exco/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  function openAddModal() {
    setEditingMember(null);
    setSelectedMember(null);
    setSearchQuery("");
    setSearchResults([]);
    setFormPosition("");
    setFormElectedAt("");
    setFormTermEnd("");
    setShowModal(true);
  }

  function openEditModal(member: ExcoMember) {
    setEditingMember(member);
    setSelectedMember({
      id: member.id,
      userId: member.userId,
      memberNumber: member.memberNumber,
      category: member.category,
      user: member.user,
    });
    setFormPosition(member.excoPosition);
    setFormElectedAt(member.excoElectedAt ? member.excoElectedAt.slice(0, 10) : "");
    setFormTermEnd(member.excoTermEnd ? member.excoTermEnd.slice(0, 10) : "");
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedMember || !formPosition) return;
    setSaving(true);
    try {
      const method = editingMember ? "PUT" : "POST";
      const res = await fetch("/api/admin/exco", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dfcMemberId: selectedMember.id,
          excoPosition: formPosition,
          excoElectedAt: formElectedAt || null,
          excoTermEnd: formTermEnd || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: editingMember ? "EXCO position updated." : "EXCO member added." });
        setShowModal(false);
        fetchExco();
      } else {
        setToast({ type: "error", message: data.error || "Failed to save." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member from EXCO?")) return;
    try {
      const res = await fetch(`/api/admin/exco?id=${memberId}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "EXCO position removed." });
        fetchExco();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to remove." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  // Occupied positions (excluding the one being edited)
  const occupiedPositions = excoMembers
    .filter((m) => m.id !== editingMember?.id)
    .map((m) => m.excoPosition);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Committee</h1>
          <p className="text-sm text-gray-600 mt-1">Manage elected EXCO positions for DFC members.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg hover:bg-[#0D1F3C]/90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Assign Position
        </button>
      </div>

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

      {excoMembers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No EXCO members assigned yet.</p>
          <p className="text-sm text-gray-400 mt-1">Use the button above to assign elected positions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Member
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Position
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Elected
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Term Ends
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {excoMembers.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                    {m.memberNumber && (
                      <p className="text-xs text-gray-400 mt-0.5">{m.memberNumber}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0D1F3C] text-white">
                      {POSITION_LABELS[m.excoPosition] || m.excoPosition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.excoElectedAt
                      ? new Date(m.excoElectedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.excoTermEnd
                      ? new Date(m.excoTermEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-gray-400 hover:text-[#0A4A50] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingMember ? "Edit EXCO Position" : "Assign EXCO Position"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member selection (only when adding) */}
            {!editingMember && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search member</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchMembers(e.target.value);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                  />
                </div>
                {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                {searchResults.length > 0 && !selectedMember && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedMember(r);
                          setSearchQuery(r.user.name);
                          setSearchResults([]);
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
                        setSearchQuery("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {editingMember && (
              <div className="mb-4 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{editingMember.user.name}</p>
                <p className="text-xs text-gray-500">{editingMember.user.email}</p>
              </div>
            )}

            {/* Position */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
              >
                <option value="">Select position</option>
                {positions.map((p) => (
                  <option key={p} value={p} disabled={occupiedPositions.includes(p)}>
                    {POSITION_LABELS[p] || p}
                    {occupiedPositions.includes(p) ? " (occupied)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Elected date</label>
                <input
                  type="date"
                  value={formElectedAt}
                  onChange={(e) => setFormElectedAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term ends</label>
                <input
                  type="date"
                  value={formTermEnd}
                  onChange={(e) => setFormTermEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedMember || !formPosition}
                className="flex-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editingMember ? "Update" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
