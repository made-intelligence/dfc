"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Payment {
  id: string;
  amount: number;
  date: string;
  reference: string;
  status: string;
}

interface DuesStatus {
  memberName: string | null;
  inGoodStanding: boolean;
  lastPaidAt: string | null;
  duesExpiresAt: string | null;
  duesStatus: string | null;
  category: string | null;
  payments: Payment[];
}

type PageState =
  | "loading"
  | "verifying"
  | "verified"
  | "new-member"
  | "returning";

function MemberDuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dues, setDues] = useState<DuesStatus | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [paying, setPaying] = useState(false);
  const [verifiedExpiresAt, setVerifiedExpiresAt] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const verifyReference = searchParams.get("reference");
  const isCallback = searchParams.get("payment") === "callback";

  const fetchDues = useCallback(async () => {
    try {
      const res = await fetch("/api/member/dues");
      if (res.ok) {
        const data: DuesStatus = await res.json();
        setDues(data);
        return data;
      }
    } catch {
      // silent
    }
    return null;
  }, []);

  // Verify payment callback
  useEffect(() => {
    if (!isCallback || !verifyReference) return;

    setPageState("verifying");
    fetch("/api/member/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", reference: verifyReference }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setVerifiedExpiresAt(
            data.duesExpiresAt
              ? new Date(data.duesExpiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null
          );
          // Re-fetch dues to get updated state
          await fetchDues();
          setPageState("verified");
        } else {
          const data = await res.json().catch(() => null);
          setToast({
            type: "error",
            message:
              data?.error ||
              "Payment verification failed. Please contact the secretariat.",
          });
          // Fall through to normal page
          const duesData = await fetchDues();
          setPageState(
            duesData?.lastPaidAt ? "returning" : "new-member"
          );
        }
      })
      .catch(() => {
        setToast({
          type: "error",
          message: "Network error during verification. Please try again.",
        });
        setPageState("returning");
      });
  }, [isCallback, verifyReference, fetchDues]);

  // Initial load (skip if callback flow handles it)
  useEffect(() => {
    if (isCallback && verifyReference) return;

    fetchDues().then((data) => {
      if (data) {
        setPageState(data.lastPaidAt ? "returning" : "new-member");
      } else {
        setPageState("new-member");
      }
    });
  }, [fetchDues, isCallback, verifyReference]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function isExpired(): boolean {
    if (!dues?.duesExpiresAt) return true;
    return new Date(dues.duesExpiresAt) < new Date();
  }

  function isExpiringSoon(): boolean {
    if (!dues?.duesExpiresAt) return true;
    const expires = new Date(dues.duesExpiresAt);
    const now = new Date();
    const diffDays =
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch("/api/member/dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
          return;
        }
      }
      const data = await res.json().catch(() => null);
      setToast({
        type: "error",
        message: data?.error || "Could not initiate payment. Please try again.",
      });
    } catch {
      setToast({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setPaying(false);
    }
  }

  const memberFirstName = dues?.memberName?.split(" ")[0] || "";

  // ── Loading state ──
  if (pageState === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0A6E75] border-r-transparent mb-4" />
          <p className="text-gray-500 text-base">
            Loading dues information...
          </p>
        </div>
      </div>
    );
  }

  // ── Verifying payment state ──
  if (pageState === "verifying") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#0A6E75] border-r-transparent mb-5" />
          <h2 className="text-xl font-semibold text-[#0D1F3C] mb-2">
            Verifying your payment...
          </h2>
          {verifyReference && (
            <p className="text-sm text-gray-500 font-mono mb-4">
              Reference: {verifyReference}
            </p>
          )}
          <p className="text-base text-gray-600">
            Please wait while we confirm your payment with Paystack.
          </p>
        </div>
      </div>
    );
  }

  // ── Verified / success state ──
  if (pageState === "verified") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          {/* Success icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#0D1F3C] mb-2">
            Payment confirmed!
          </h2>
          <p className="text-base text-gray-600 mb-6">
            Your DFC membership is now active
            {verifiedExpiresAt ? ` until ${verifiedExpiresAt}` : ""}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/member/dashboard")}
              className="px-6 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-base font-medium hover:bg-[#0D1F3C]/90 transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push("/member/profile")}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-50 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── New member (never paid) ──
  if (pageState === "new-member") {
    return (
      <div>
        <div className="max-w-2xl">
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header band */}
            <div className="bg-[#0D1F3C] px-6 py-5">
              <h1 className="text-xl font-semibold text-white">
                Welcome to DFC
                {memberFirstName ? `, Dr. ${memberFirstName}` : ""}
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Complete your membership by paying your annual dues.
              </p>
            </div>

            <div className="px-6 py-6">
              <p className="text-base text-gray-700 mb-4">
                Your annual dues grant you:
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Full voting rights at the Annual General Meeting",
                  "Access to all DFC initiatives and committees",
                  "Clinical dashboard for specialist consultations",
                  "Listing in the DFC specialist directory",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-base text-gray-700">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0A6E75]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-base text-gray-600">Annual dues</span>
                  <span className="text-2xl font-semibold text-[#0D1F3C]">
                    {"\u20A6"}150,000
                  </span>
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full px-8 py-3 rounded-lg bg-[#0A6E75] text-white text-base font-medium hover:bg-[#0A6E75]/90 focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {paying ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Processing...
                    </span>
                  ) : (
                    "Pay now"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Returning member ──
  const expired = isExpired();
  const expiringSoon = isExpiringSoon();

  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[#0D1F3C] mb-1">
          Membership Dues
        </h1>
        <p className="text-base text-gray-600 mb-8">
          View your standing and manage annual dues payments.
        </p>

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

        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0D1F3C]">
              Current Standing
            </h2>
            {dues?.inGoodStanding && !expired ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border border-green-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Good Standing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {expired ? "Expired" : "Dues Outstanding"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
            <div>
              <p className="text-sm text-gray-500">Last paid</p>
              <p className="text-gray-900 font-medium">
                {formatDate(dues?.lastPaidAt ?? null)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valid until</p>
              <p
                className={`font-medium ${
                  expired ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatDate(dues?.duesExpiresAt ?? null)}
              </p>
            </div>
          </div>

          {expiringSoon && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                expired
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              {expired
                ? "Your membership dues have expired. Please renew to maintain good standing."
                : "Your membership dues will expire soon. Please renew to avoid interruption."}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#0D1F3C] text-white text-base font-medium hover:bg-[#0D1F3C]/90 focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {paying ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Processing...
                </span>
              ) : expired ? (
                "Renew membership \u2014 \u20A6150,000"
              ) : (
                "Pay annual dues \u2014 \u20A6150,000"
              )}
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#0D1F3C] mb-4">
            Payment History
          </h2>

          {!dues?.payments || dues.payments.length === 0 ? (
            <p className="text-base text-gray-500">
              No payment records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-medium text-gray-700 text-sm">
                      Date
                    </th>
                    <th className="text-left py-3 pr-4 font-medium text-gray-700 text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 pr-4 font-medium text-gray-700 text-sm">
                      Reference
                    </th>
                    <th className="text-left py-3 font-medium text-gray-700 text-sm">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dues.payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-gray-900">
                        {formatDate(payment.date)}
                      </td>
                      <td className="py-3 pr-4 text-gray-900">
                        {"\u20A6"}
                        {payment.amount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono text-sm">
                        {payment.reference}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-sm font-medium text-green-700">
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemberDuesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0A6E75] border-r-transparent mb-4" />
            <p className="text-gray-500 text-base">Loading...</p>
          </div>
        </div>
      }
    >
      <MemberDuesContent />
    </Suspense>
  );
}
