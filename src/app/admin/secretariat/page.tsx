"use client";

import { useState, useEffect, useCallback } from "react";

interface Ticket {
  id: string;
  reference?: string;
  fromName: string;
  fromPhone?: string;
  requestType: string;
  intent?: string;
  status: "OPEN" | "IN_PROGRESS" | "AWAITING_MEMBER" | "COMPLETED" | "CLOSED";
  source: "WEB" | "WHATSAPP";
  rawMessage: string;
  notes?: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "AWAITING_MEMBER", "COMPLETED", "CLOSED"] as const;

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  AWAITING_MEMBER: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

const SOURCE_COLORS: Record<string, string> = {
  WEB: "bg-indigo-100 text-indigo-800",
  WHATSAPP: "bg-emerald-100 text-emerald-800",
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Awaiting Member", value: "AWAITING_MEMBER" },
  { label: "Completed", value: "COMPLETED" },
];

const SOURCE_TABS = [
  { label: "All", value: "" },
  { label: "WEB", value: "WEB" },
  { label: "WHATSAPP", value: "WHATSAPP" },
];

export default function SecretariatPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [searchType, setSearchType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Per-ticket state
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});
  const [classifyResult, setClassifyResult] = useState<Record<string, string>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReply, setShowReply] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (searchType) params.set("requestType", searchType);

      const res = await fetch(`/api/admin/secretariat?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets ?? data ?? []);
      }
    } catch {
      console.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, searchType]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  async function updateStatus(ticket: Ticket) {
    const newStatus = editStatus[ticket.id];
    if (!newStatus) return;
    setActionLoading((p) => ({ ...p, [ticket.id + "_status"]: true }));
    try {
      const body: Record<string, string> = { status: newStatus };
      if (editNotes[ticket.id]) body.notes = editNotes[ticket.id];
      await fetch(`/api/admin/secretariat/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchTickets();
    } catch {
      console.error("Failed to update status");
    } finally {
      setActionLoading((p) => ({ ...p, [ticket.id + "_status"]: false }));
    }
  }

  async function classifyTicket(ticket: Ticket) {
    setActionLoading((p) => ({ ...p, [ticket.id + "_classify"]: true }));
    try {
      const res = await fetch("/api/admin/secretariat/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, message: ticket.rawMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setClassifyResult((p) => ({ ...p, [ticket.id]: JSON.stringify(data, null, 2) }));
      }
    } catch {
      console.error("Failed to classify ticket");
    } finally {
      setActionLoading((p) => ({ ...p, [ticket.id + "_classify"]: false }));
    }
  }

  async function sendReply(ticket: Ticket) {
    const text = replyText[ticket.id];
    if (!text) return;
    setActionLoading((p) => ({ ...p, [ticket.id + "_reply"]: true }));
    try {
      await fetch("/api/admin/secretariat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, message: text, phone: ticket.fromPhone }),
      });
      setReplyText((p) => ({ ...p, [ticket.id]: "" }));
      setShowReply((p) => ({ ...p, [ticket.id]: false }));
    } catch {
      console.error("Failed to send reply");
    } finally {
      setActionLoading((p) => ({ ...p, [ticket.id + "_reply"]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
          Secretariat Dashboard
        </h1>
        <p className="mb-8 text-base text-gray-500" style={{ fontSize: "16px" }}>
          Manage incoming requests and tickets.
        </p>

        {/* Status filter tabs */}
        <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium ${
                statusFilter === tab.value
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source filter + search */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  sourceFilter === tab.value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by request type..."
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Loading */}
        {loading && <div className="py-16 text-center text-sm text-gray-500">Loading tickets...</div>}

        {/* Ticket list */}
        {!loading && tickets.length === 0 && (
          <div className="rounded-lg border border-gray-200 py-16 text-center">
            <p className="text-base text-gray-500" style={{ fontSize: "16px" }}>
              No tickets found.
            </p>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="space-y-2">
            {tickets.map((ticket) => {
              const isExpanded = expandedId === ticket.id;
              return (
                <div key={ticket.id} className="rounded-lg border border-gray-200">
                  {/* Row header */}
                  <button
                    onClick={() => toggleExpand(ticket.id)}
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {ticket.reference ?? ticket.id.slice(0, 8)}
                    </span>
                    <span className="text-sm text-gray-600">{ticket.fromName}</span>
                    <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {ticket.requestType}
                    </span>
                    {ticket.intent && (
                      <span className="text-xs text-gray-400">{ticket.intent}</span>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[ticket.source]}`}
                    >
                      {ticket.source}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-4">
                      {/* Raw message */}
                      <div className="mb-4">
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Raw Message
                        </h4>
                        <p
                          className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800"
                          style={{ fontSize: "16px" }}
                        >
                          {ticket.rawMessage}
                        </p>
                      </div>

                      {/* AI Brief */}
                      {ticket.notes && (
                        <div className="mb-4">
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            AI Brief
                          </h4>
                          <p className="whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm text-blue-900">
                            {ticket.notes}
                          </p>
                        </div>
                      )}

                      {/* Notes field */}
                      <div className="mb-4">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          value={editNotes[ticket.id] ?? ticket.notes ?? ""}
                          onChange={(e) =>
                            setEditNotes((p) => ({ ...p, [ticket.id]: e.target.value }))
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Status updater */}
                      <div className="mb-4 flex items-center gap-2">
                        <select
                          value={editStatus[ticket.id] ?? ticket.status}
                          onChange={(e) =>
                            setEditStatus((p) => ({ ...p, [ticket.id]: e.target.value }))
                          }
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateStatus(ticket)}
                          disabled={actionLoading[ticket.id + "_status"]}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {actionLoading[ticket.id + "_status"] ? "Updating..." : "Update"}
                        </button>
                      </div>

                      {/* Classify button */}
                      <div className="mb-4">
                        <button
                          onClick={() => classifyTicket(ticket)}
                          disabled={actionLoading[ticket.id + "_classify"]}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {actionLoading[ticket.id + "_classify"]
                            ? "Classifying..."
                            : "Run AI classification"}
                        </button>
                        {classifyResult[ticket.id] && (
                          <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-700">
                            {classifyResult[ticket.id]}
                          </pre>
                        )}
                      </div>

                      {/* WhatsApp reply */}
                      {ticket.fromPhone && (
                        <div>
                          {!showReply[ticket.id] ? (
                            <button
                              onClick={() =>
                                setShowReply((p) => ({ ...p, [ticket.id]: true }))
                              }
                              className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              Reply via WhatsApp
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={replyText[ticket.id] ?? ""}
                                onChange={(e) =>
                                  setReplyText((p) => ({ ...p, [ticket.id]: e.target.value }))
                                }
                                placeholder="Type your reply..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => sendReply(ticket)}
                                  disabled={
                                    !replyText[ticket.id] || actionLoading[ticket.id + "_reply"]
                                  }
                                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {actionLoading[ticket.id + "_reply"] ? "Sending..." : "Send"}
                                </button>
                                <button
                                  onClick={() =>
                                    setShowReply((p) => ({ ...p, [ticket.id]: false }))
                                  }
                                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
