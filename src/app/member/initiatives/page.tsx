"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  LogOut,
  UserPlus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { formatDateLong } from "@/lib/utils/member";

interface Membership {
  id: string;
  role: string;
  joinedAt: string;
  initiativeId: string;
  initiative: {
    id: string;
    name: string;
    type: string;
    status: string;
    remit: string | null;
    description: string | null;
  };
  pillar: { id: string; name: string } | null;
}

interface AvailableInitiative {
  id: string;
  name: string;
  type: string;
  description: string | null;
  remit: string | null;
  pillars: { id: string; name: string }[];
  memberCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  TWG: "Technical Working Group",
  TASK_FORCE: "Task Force",
  COMMITTEE: "Committee",
  PROJECT: "Project",
};

const TYPE_BADGE_STYLES: Record<string, string> = {
  TWG: "bg-[#0D1F3C] text-white",
  COMMITTEE: "bg-[#0A6E75] text-white",
  TASK_FORCE: "bg-amber-500 text-white",
  PROJECT: "bg-blue-600 text-white",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-50 text-blue-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const ROLE_STYLES: Record<string, string> = {
  LEAD: "bg-[#0D1F3C] text-white",
  CO_LEAD: "bg-[#0A4A50] text-white",
  ADVISOR: "bg-amber-100 text-amber-800",
  MEMBER: "bg-gray-100 text-gray-700",
};

const FILTER_TABS = ["All", "TWG", "COMMITTEE", "TASK_FORCE", "PROJECT"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function MemberInitiativesPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [available, setAvailable] = useState<AvailableInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  // Leave state
  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Join state
  const [joinInitiative, setJoinInitiative] = useState<AvailableInitiative | null>(null);
  const [joinPillarId, setJoinPillarId] = useState<string>("");
  const [joinNote, setJoinNote] = useState("");
  const [joining, setJoining] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/member/initiatives")
      .then((res) => res.json())
      .then((data) => {
        if (data.memberships) setMemberships(data.memberships);
        if (data.available) setAvailable(data.available);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeave = async (membershipId: string) => {
    setLeaving(true);
    try {
      const res = await fetch("/api/member/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", membershipId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("You have left the initiative.");
        setLeaveConfirmId(null);
        fetchData();
      } else {
        showToast(data.error || "Failed to leave.", "error");
      }
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setLeaving(false);
    }
  };

  const handleJoin = async () => {
    if (!joinInitiative) return;
    setJoining(true);
    try {
      const res = await fetch("/api/member/initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          initiativeId: joinInitiative.id,
          pillarId: joinPillarId || undefined,
          note: joinNote || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`You have joined ${joinInitiative.name}.`);
        setJoinInitiative(null);
        setJoinPillarId("");
        setJoinNote("");
        fetchData();
      } else {
        showToast(data.error || "Failed to join.", "error");
      }
    } catch {
      showToast("Something went wrong.", "error");
    } finally {
      setJoining(false);
    }
  };

  const filteredAvailable =
    activeFilter === "All"
      ? available
      : available.filter((i) => i.type === activeFilter);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Committees & Initiatives
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View your current memberships and browse available committees to join.
        </p>
      </div>

      {/* ──── Section 1: My Committees ──── */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          My Committees
        </h2>

        {memberships.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <Users className="w-9 h-9 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">
              You are not a member of any committees yet.
            </p>
            <p className="text-sm text-gray-400">
              Browse available committees below to request to join.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {memberships.map((m) => {
              const expanded = expandedId === m.id;
              const isLeaveTarget = leaveConfirmId === m.id;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="flex items-start">
                    <button
                      onClick={() => setExpandedId(expanded ? null : m.id)}
                      className="flex-1 text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {m.initiative.name}
                          </p>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              TYPE_BADGE_STYLES[m.initiative.type] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {TYPE_LABELS[m.initiative.type] || m.initiative.type}
                          </span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_STYLES[m.initiative.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {m.initiative.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {m.pillar && (
                            <>
                              <span className="text-xs text-gray-500">
                                {m.pillar.name}
                              </span>
                              <span className="text-gray-300">·</span>
                            </>
                          )}
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              ROLE_STYLES[m.role] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {m.role}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            Joined {formatDateLong(m.joinedAt)}
                          </span>
                        </div>
                      </div>
                      {(m.initiative.remit || m.initiative.description) &&
                        (expanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                        ))}
                    </button>

                    {/* Leave button */}
                    <div className="px-4 py-4 shrink-0">
                      {isLeaveTarget ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLeave(m.id)}
                            disabled={leaving}
                            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {leaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </button>
                          <button
                            onClick={() => setLeaveConfirmId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setLeaveConfirmId(m.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                          title="Leave this initiative"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Leave</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded &&
                    (m.initiative.remit || m.initiative.description) && (
                      <div className="px-6 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Remit
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {m.initiative.remit || m.initiative.description}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ──── Section 2: Available Committees ──── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Committees
        </h2>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {FILTER_TABS.map((tab) => {
            const count =
              tab === "All"
                ? available.length
                : available.filter((i) => i.type === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === tab
                    ? "bg-[#0D1F3C] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab === "All"
                  ? "All"
                  : tab === "TASK_FORCE"
                    ? "Task Force"
                    : tab === "TWG"
                      ? "TWG"
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                {" "}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {filteredAvailable.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <Users className="w-9 h-9 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {available.length === 0
                ? "No committees are currently open for membership."
                : "No committees match this filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredAvailable.map((initiative) => (
              <div
                key={initiative.id}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:border-[#0A6E75] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                      {initiative.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_BADGE_STYLES[initiative.type] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {TYPE_LABELS[initiative.type] || initiative.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {initiative.memberCount}{" "}
                        {initiative.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>
                </div>

                {(initiative.remit || initiative.description) && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {initiative.remit || initiative.description}
                  </p>
                )}

                {initiative.pillars.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {initiative.pillars.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setJoinInitiative(initiative);
                    setJoinPillarId("");
                    setJoinNote("");
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#0D1F3C] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#162d54] transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Request to Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──── Join Modal ──── */}
      {joinInitiative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Join {joinInitiative.name}
              </h3>
              <button
                onClick={() => setJoinInitiative(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {joinInitiative.pillars.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select a Pillar
                  </label>
                  <select
                    value={joinPillarId}
                    onChange={(e) => setJoinPillarId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent"
                  >
                    <option value="">-- No specific pillar --</option>
                    {joinInitiative.pillars.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note / Reason{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={joinNote}
                  onChange={(e) => setJoinNote(e.target.value)}
                  rows={3}
                  placeholder="Why would you like to join this committee?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setJoinInitiative(null)}
                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-[#0D1F3C] rounded-lg hover:bg-[#162d54] transition-colors disabled:opacity-50"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {joining ? "Joining..." : "Request to Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
