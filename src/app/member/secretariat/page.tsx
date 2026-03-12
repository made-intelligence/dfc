"use client";

import { useState, useEffect } from "react";

const REQUEST_TYPES = [
  "Licence Renewal Support",
  "Letter of Good Standing",
  "Membership Certificate",
  "Recommendation Letter",
  "General Enquiry",
];

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_MEMBER"
  | "COMPLETED"
  | "CLOSED";

interface Ticket {
  id: string;
  requestType: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: "bg-red-50 text-red-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  AWAITING_MEMBER: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-50 text-gray-700",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  AWAITING_MEMBER: "Awaiting Member",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export default function MemberSecretariatPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchTickets() {
    try {
      const res = await fetch("/api/member/secretariat");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestType || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/secretariat/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, description: description.trim() }),
      });
      if (res.ok) {
        setToast({
          type: "success",
          message:
            "Request submitted successfully. The secretariat will review it shortly.",
        });
        setModalOpen(false);
        setRequestType("");
        setDescription("");
        fetchTickets();
      } else {
        const data = await res.json().catch(() => null);
        setToast({
          type: "error",
          message: data?.error || "Failed to submit request. Please try again.",
        });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-base">Loading requests...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Secretariat Requests
            </h1>
            <p className="text-base text-gray-600">
              Submit and track requests to the DFC secretariat.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-base font-medium hover:bg-[#0D1F3C]/90 focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:ring-offset-2 transition-colors"
          >
            New request
          </button>
        </div>

        {toast && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-base ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Your requests
            </h2>
          </div>

          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-base text-gray-500 mb-1">
                No requests found.
              </p>
              <p className="text-sm text-gray-400">
                Use the &quot;New request&quot; button to submit a request to the
                secretariat.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-gray-900">
                        {ticket.requestType}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Submitted {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ${
                        STATUS_STYLES[ticket.status] || "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!submitting) setModalOpen(false);
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              New Secretariat Request
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Describe what you need and the secretariat team will follow up.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Request Type */}
              <div>
                <label
                  htmlFor="requestType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Request type
                </label>
                <select
                  id="requestType"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                >
                  <option value="">Select a type</option>
                  {REQUEST_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Provide details about your request..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50] resize-vertical"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !requestType || !description.trim()}
                  className="px-5 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-base font-medium hover:bg-[#0D1F3C]/90 focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
