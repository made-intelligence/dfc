"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Search, X, ChevronDown, ChevronUp } from "lucide-react";

interface CommitteeMember {
  id: string;
  memberName: string;
  role: string;
  isActive: boolean;
  isUnlinked: boolean;
  joinedAt: string;
  endedAt: string | null;
  user: { id: string; name: string; email: string; profileImage: string | null } | null;
}

interface Committee {
  id: string;
  name: string;
  shortCode: string;
  description: string | null;
  mandate: string | null;
  isActive: boolean;
  members: CommitteeMember[];
  _count: { members: number };
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "Chair",
  DEPUTY_CHAIR: "Deputy Chair",
  SECRETARY: "Secretary",
  MEMBER: "Member",
};

const ROLE_STYLES: Record<string, string> = {
  CHAIR: "bg-[#0D1F3C] text-white",
  DEPUTY_CHAIR: "bg-[#0A6E75] text-white",
  SECRETARY: "bg-amber-100 text-amber-800",
  MEMBER: "bg-gray-100 text-gray-700",
};

export default function AdminCommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [targetCommitteeId, setTargetCommitteeId] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [formMemberName, setFormMemberName] = useState("");
  const [formRole, setFormRole] = useState("MEMBER");
  const [saving, setSaving] = useState(false);

  const fetchCommittees = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/committees");
      const data = await res.json();
      if (data.data) {
        setCommittees(data.data);
      }
    } catch {
      console.error("Failed to fetch committees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function searchUsers(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/exco/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results.map((r: { userId: string; user: { name: string; email: string } }) => ({
          id: r.userId,
          name: r.user.name,
          email: r.user.email,
        })));
      }
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  function openAddModal(committeeId: string) {
    setEditingMember(null);
    setTargetCommitteeId(committeeId);
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setFormMemberName("");
    setFormRole("MEMBER");
    setShowModal(true);
  }

  function openEditModal(member: CommitteeMember, committeeId: string) {
    setEditingMember(member);
    setTargetCommitteeId(committeeId);
    setFormRole(member.role);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formMemberName && !selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/committees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committeeId: targetCommitteeId,
          userId: selectedUser?.id || null,
          memberName: formMemberName || selectedUser?.name || "",
          role: formRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Member added to committee." });
        setShowModal(false);
        fetchCommittees();
      } else {
        setToast({ type: "error", message: data.error || "Failed to add member." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRole() {
    if (!editingMember) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/committees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: editingMember.id,
          role: formRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Member role updated." });
        setShowModal(false);
        fetchCommittees();
      } else {
        setToast({ type: "error", message: data.error || "Failed to update." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(memberId: string) {
    if (!confirm("Remove this member from the committee?")) return;
    try {
      const res = await fetch("/api/admin/committees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, isActive: false }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "Member removed from committee." });
        fetchCommittees();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Failed to remove." });
      }
    } catch {
      setToast({ type: "error", message: "Network error." });
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Standing Committees</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage the 6 constitutional standing committees and their members.
        </p>
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

      <div className="space-y-4">
        {committees.map((committee) => {
          const isExpanded = expandedId === committee.id;
          return (
            <div
              key={committee.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Committee header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : committee.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-[#0D1F3C]/5 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#0D1F3C]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{committee.name}</h3>
                      <span className="text-xs font-mono text-gray-400">{committee.shortCode}</span>
                    </div>
                    {committee.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{committee.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A6E75]/10 text-[#0A6E75]">
                    {committee._count.members} member{committee._count.members !== 1 ? "s" : ""}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {committee.mandate && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Mandate:</span> {committee.mandate}
                      </p>
                    </div>
                  )}

                  {committee.members.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No members assigned yet.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Member
                          </th>
                          <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Role
                          </th>
                          <th className="text-left px-6 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Joined
                          </th>
                          <th className="text-right px-6 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {committee.members.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <p className="text-sm font-medium text-gray-900">{m.memberName}</p>
                              {m.user && (
                                <p className="text-xs text-gray-500">{m.user.email}</p>
                              )}
                              {m.isUnlinked && (
                                <span className="text-xs text-amber-600">Unlinked</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                  ROLE_STYLES[m.role] || ROLE_STYLES.MEMBER
                                }`}
                              >
                                {ROLE_LABELS[m.role] || m.role}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {new Date(m.joinedAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(m, committee.id)}
                                  className="p-1.5 text-gray-400 hover:text-[#0A6E75] transition-colors"
                                  title="Edit role"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeactivate(m.id)}
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
                  )}

                  <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => openAddModal(committee.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[#0A6E75] hover:text-[#0A6E75]/80 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingMember ? "Edit Member Role" : "Add Committee Member"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* When adding new member */}
            {!editingMember && (
              <>
                {/* Search for linked user */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search DFC member (optional)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="Search by name or email..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-[#0A6E75]"
                    />
                  </div>
                  {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedUser(r);
                            setFormMemberName(r.name);
                            setSearchQuery(r.name);
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setSearchQuery("");
                          setFormMemberName("");
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Member name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member name</label>
                  <input
                    type="text"
                    value={formMemberName}
                    onChange={(e) => setFormMemberName(e.target.value)}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-[#0A6E75]"
                  />
                  {!selectedUser && formMemberName && (
                    <p className="text-xs text-amber-600 mt-1">
                      This member will be added as unlinked (no platform account).
                    </p>
                  )}
                </div>
              </>
            )}

            {/* When editing, show member info */}
            {editingMember && (
              <div className="mb-4 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{editingMember.memberName}</p>
                {editingMember.user && (
                  <p className="text-xs text-gray-500">{editingMember.user.email}</p>
                )}
              </div>
            )}

            {/* Role */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-[#0A6E75]"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingMember ? handleUpdateRole : handleSave}
                disabled={saving || (!editingMember && !formMemberName)}
                className="flex-1 px-4 py-2 bg-[#0D1F3C] text-white rounded-lg text-sm font-medium hover:bg-[#0D1F3C]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editingMember ? "Update Role" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
