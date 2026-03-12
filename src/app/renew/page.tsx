"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Eye,
  Users,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

interface AnnualReport {
  member: {
    name: string;
    category: string;
    memberSince: string;
  };
  year: number;
  income: {
    total: number;
    bySource: {
      secondOpinion: number;
      deployments: number;
      splCases: number;
      spaceBookingMarkup: number;
      diagnosticMarkup: number;
    };
    settled: number;
    pending: number;
  };
  visibility: {
    profileViews: number;
    byViewerType: {
      hospitalAdmin: number;
      patient: number;
      hmo: number;
      dfcMember: number;
    };
    topViewMonths: string[];
  };
  network: {
    referralsSent: number;
    referralsReceived: number;
    activeReferralConnections: number;
  };
  clinical: {
    cmeHoursLogged: number;
    secondOpinionCasesReviewed: number;
    deploymentsCompleted: number;
    credentialsVerified: number;
    patientsSeen: number;
    prescriptionsIssued: number;
  };
  committees: string[];
  renewalValue: string;
}

export default function RenewPage() {
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(
          `/api/member/annual-report?year=${new Date().getFullYear()}`
        );
        if (res.status === 401) {
          router.push("/auth/login?redirect=/renew");
          return;
        }
        if (!res.ok) throw new Error("Failed to load report");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [router]);

  async function handleRenew() {
    setProcessing(true);
    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 150000,
          paymentType: "ANNUAL_DUES",
          metadata: { type: "ANNUAL_DUES", year: new Date().getFullYear() },
        }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setError("Payment initialization failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-lg">
          Loading your DFC impact report...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Unable to load report"}</p>
          <button
            onClick={() => router.push("/auth/login?redirect=/renew")}
            className="bg-[#0D1F3C] text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-[#162d52] transition"
          >
            Sign in to continue
          </button>
        </div>
      </div>
    );
  }

  const hasIncome = report.income.total > 0;
  const hasActivity =
    report.visibility.profileViews > 0 ||
    report.network.activeReferralConnections > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0D1F3C] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">
            Membership Renewal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Your {report.year} Year With DFC
          </h1>
          <p className="text-lg text-gray-300">
            {report.member.name} — {report.member.category.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-20 space-y-8">
        {/* ===== ACT 1 — Your Year With DFC ===== */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Your Impact
          </h2>

          {/* Value statement */}
          <div className="bg-gradient-to-r from-[#0D1F3C] to-[#1a3a6b] text-white rounded-xl p-6 mb-6">
            <p className="text-lg font-medium">{report.renewalValue}</p>
          </div>

          {/* Income breakdown */}
          {hasIncome && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Platform Income
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {report.income.bySource.secondOpinion > 0 && (
                  <StatCard
                    label="Second Opinion"
                    value={`₦${report.income.bySource.secondOpinion.toLocaleString()}`}
                  />
                )}
                {report.income.bySource.deployments > 0 && (
                  <StatCard
                    label="Deployments"
                    value={`₦${report.income.bySource.deployments.toLocaleString()}`}
                  />
                )}
                {report.income.bySource.splCases > 0 && (
                  <StatCard
                    label="SPL Cases"
                    value={`₦${report.income.bySource.splCases.toLocaleString()}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Profile Visibility
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Views"
                value={report.visibility.profileViews.toString()}
              />
              <StatCard
                label="Hospital Admins"
                value={report.visibility.byViewerType.hospitalAdmin.toString()}
              />
              <StatCard
                label="Patients"
                value={report.visibility.byViewerType.patient.toString()}
              />
              <StatCard
                label="HMOs"
                value={report.visibility.byViewerType.hmo.toString()}
              />
            </div>
          </div>

          {/* Network */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Network
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Referrals Sent"
                value={report.network.referralsSent.toString()}
              />
              <StatCard
                label="Referrals Received"
                value={report.network.referralsReceived.toString()}
              />
              <StatCard
                label="Connections"
                value={report.network.activeReferralConnections.toString()}
              />
            </div>
          </div>

          {/* Clinical */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Clinical Activity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Patients Seen"
                value={report.clinical.patientsSeen.toString()}
              />
              <StatCard
                label="Cases Reviewed"
                value={report.clinical.secondOpinionCasesReviewed.toString()}
              />
              <StatCard
                label="Prescriptions"
                value={report.clinical.prescriptionsIssued.toString()}
              />
              <StatCard
                label="Credentials Verified"
                value={report.clinical.credentialsVerified.toString()}
              />
            </div>
          </div>

          {report.committees.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Active committees:</span>{" "}
                {report.committees.join(", ")}
              </p>
            </div>
          )}
        </section>

        {/* ===== ACT 2 — What Continues With Renewal ===== */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            What Continues With Renewal
          </h2>
          <ul className="space-y-3">
            <ContinueItem text="Your verified DFC badge remains visible on the public directory" />
            <ContinueItem text="Your profile appears in hospital and patient searches" />
            {report.clinical.secondOpinionCasesReviewed > 0 && (
              <ContinueItem text="Your second opinion panel access continues" />
            )}
            {report.network.activeReferralConnections > 0 && (
              <ContinueItem
                text={`Your ${report.network.activeReferralConnections} referral network connections remain active`}
              />
            )}
            {report.committees.length > 0 && (
              <ContinueItem
                text={`Your committee roles continue (${report.committees.join(", ")})`}
              />
            )}
            <ContinueItem text="Clinical workspace bookings at partner hospitals" />
            <ContinueItem text="EMR access and prescription management" />
          </ul>
        </section>

        {/* ===== ACT 3 — What Pauses If You Don't Renew ===== */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-amber-200">
          <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            What Pauses If You Don&apos;t Renew
          </h2>

          <p className="text-base text-gray-600 mb-4">
            After a 30-day grace period, the following restrictions apply:
          </p>

          <ul className="space-y-3 mb-6">
            <PauseItem text="Verified badge removed from public listing" />
            <PauseItem text="Hospital directory listing paused — won't appear in searches" />
            <PauseItem text="Second opinion panel access suspended" />
            <PauseItem text="Clinical workspace bookings disabled" />
            {report.committees.length > 0 && (
              <PauseItem text="Committee roles flagged for review (Art. III)" />
            )}
            <PauseItem text="Referral network connections paused" />
          </ul>

          <div className="bg-[#0D1F3C] rounded-xl p-6 text-center">
            <p className="text-white text-lg font-semibold mb-1">
              Annual Membership Dues
            </p>
            <p className="text-3xl font-bold text-white mb-4">₦150,000</p>
            <button
              onClick={handleRenew}
              disabled={processing}
              className="w-full sm:w-auto bg-white text-[#0D1F3C] font-bold px-10 py-4 rounded-xl text-lg hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {processing ? "Processing..." : "Renew My Membership"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-[#0D1F3C]">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function ContinueItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <ChevronRight className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
      <span className="text-base text-gray-700">{text}</span>
    </li>
  );
}

function PauseItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
      <span className="text-base text-gray-700">{text}</span>
    </li>
  );
}
