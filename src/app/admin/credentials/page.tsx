"use client";

import { useState, useEffect, useCallback } from "react";

interface Credential {
  id: string;
  type: string;
  registrationNumber: string;
  issuingBody: string;
  country: string;
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "EXPIRED" | "REJECTED";
  documentUrl: string | null;
  rejectionReason: string | null;
  createdAt: string;
  dfcMember: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
}

const STATUS_BADGE: Record<string, string> = {
  UNVERIFIED: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Rejected", value: "REJECTED" },
] as const;

export default function CredentialVerificationPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  // Modal state
  const [verifyModalId, setVerifyModalId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "PENDING") {
        // Pending tab shows both UNVERIFIED and PENDING
        // We fetch all and filter client-side for this combined tab
      } else if (activeTab) {
        params.set("status", activeTab);
      }

      const res = await fetch(`/api/admin/credentials?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items: Credential[] = data.credentials ?? [];

        // Client-side filter for the "Pending" combined tab
        if (activeTab === "PENDING") {
          items = items.filter(
            (c) => c.status === "UNVERIFIED" || c.status === "PENDING"
          );
        }

        setCredentials(items);
      }
    } catch {
      console.error("Failed to fetch credentials");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  async function handleVerify() {
    if (!verifyModalId || !confirmChecked) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/credentials/${verifyModalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VERIFIED" }),
      });
      if (res.ok) {
        setVerifyModalId(null);
        setConfirmChecked(false);
        fetchCredentials();
      }
    } catch {
      console.error("Failed to verify credential");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectModalId || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/credentials/${rejectModalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalId(null);
        setRejectReason("");
        fetchCredentials();
      }
    } catch {
      console.error("Failed to reject credential");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <h1
          className="mb-2 font-serif text-3xl font-bold tracking-tight"
          style={{ color: "#0D1F3C" }}
        >
          Credential Verification
        </h1>
        <p className="mb-8 text-base text-gray-500">
          Review and verify member medical credentials against primary sources.
        </p>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-b-2 text-[#0D1F3C]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={
                activeTab === tab.value
                  ? { borderBottomColor: "#0D1F3C" }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading credentials...
          </div>
        )}

        {/* Empty state */}
        {!loading && credentials.length === 0 && (
          <div className="rounded-lg border border-gray-200 py-16 text-center">
            <p className="text-base text-gray-500">No credentials found.</p>
          </div>
        )}

        {/* Table */}
        {!loading && credentials.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reg. Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Issuing Body
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {credentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {cred.dfcMember.user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {cred.dfcMember.user.email}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {cred.type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 font-mono">
                      {cred.registrationNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {cred.issuingBody}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(cred.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {cred.documentUrl ? (
                        <a
                          href={cred.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline"
                          style={{ color: "#0D1F3C" }}
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[cred.status]}`}
                      >
                        {cred.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {(cred.status === "UNVERIFIED" ||
                        cred.status === "PENDING") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setVerifyModalId(cred.id)}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                            style={{ backgroundColor: "#0D1F3C" }}
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => setRejectModalId(cred.id)}
                            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Confirmation Modal */}
      {verifyModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2
              className="mb-4 font-serif text-lg font-bold"
              style={{ color: "#0D1F3C" }}
            >
              Confirm Verification
            </h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                I confirm this credential has been verified against the primary
                source.
              </span>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setVerifyModalId(null);
                  setConfirmChecked(false);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!confirmChecked || actionLoading}
                className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "#0D1F3C" }}
              >
                {actionLoading ? "Verifying..." : "Verify Credential"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2
              className="mb-4 font-serif text-lg font-bold"
              style={{ color: "#0D1F3C" }}
            >
              Reject Credential
            </h2>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason for rejection
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModalId(null);
                  setRejectReason("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject Credential"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
