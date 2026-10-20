"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Plus,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";

interface Overview {
  partner: { name: string; shortName: string };
  cases: {
    total: number;
    awaitingTriage: number;
    inProgress: number;
    reportsReady: number;
    completed: number;
    cancelled: number;
    submittedThisMonth: number;
  };
  recentCases: {
    id: string;
    referenceNumber: string;
    patientRef: string;
    serviceType: string;
    specialty: string;
    status: string;
    submittedAt: string;
  }[];
  contract: {
    id: string;
    title: string;
    model: string;
    subscribedVolume: number | null;
    subscriptionPeriod: string | null;
    casesDeliveredThisPeriod: number | null;
    casesRemainingThisPeriod: number | null;
    startDate: string;
    endDate: string | null;
  } | null;
  invoices: {
    unpaidCount: number;
    unpaidTotal: number;
    overdueCount: number;
    overdueTotal: number;
    currency: string;
    upcoming: {
      id: string;
      invoiceNumber: string;
      total: number;
      dueDate: string;
      isOverdue: boolean;
    }[];
  };
}

// Same palette as the cases list.
const STATUS_BADGE_STYLES: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  TRIAGED: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-indigo-100 text-indigo-700",
  REPORT_READY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  BILLED: "bg-teal-100 text-teal-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  SECOND_OPINION: "Second Opinion",
  SPECIALIST_CONSULTATION: "Specialist Consultation",
  SURGICAL_REVIEW: "Surgical Review",
};

const MODEL_LABELS: Record<string, string> = {
  FEE_FOR_SERVICE: "Fee for service",
  SUBSCRIPTION: "Subscription",
  HYBRID: "Hybrid",
};

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  ANNUAL: "year",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);

const humanize = (value: string) => value.replace(/_/g, " ");

export default function SPLOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/spl/dashboard")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) throw new Error(body.error || "Failed to load the overview");
        setData(body);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load the overview");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!data) return <Loading />;

  const { cases, contract, invoices } = data;
  const volume = contract?.subscribedVolume ?? null;
  const used = contract?.casesDeliveredThisPeriod ?? 0;
  const usedPct = volume ? Math.min(100, Math.round((used / volume) * 100)) : 0;

  const stats = [
    { label: "Awaiting triage", value: cases.awaitingTriage, icon: Inbox, tone: "text-gray-700 bg-gray-100" },
    { label: "In progress", value: cases.inProgress, icon: Clock, tone: "text-indigo-700 bg-indigo-100" },
    { label: "Reports ready", value: cases.reportsReady, icon: FileText, tone: "text-purple-700 bg-purple-100" },
    { label: "Completed", value: cases.completed, icon: CheckCircle2, tone: "text-green-700 bg-green-100" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F3C]">Overview</h1>
            <p className="mt-1 text-sm text-gray-500">
              {data.partner.name} · {cases.total} case{cases.total === 1 ? "" : "s"} in total,{" "}
              {cases.submittedThisMonth} this month
            </p>
          </div>
          <Button
            onClick={() => router.push("/spl/cases/new")}
            className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Submit New Case
          </Button>
        </div>

        {/* Overdue alert */}
        {invoices.overdueCount > 0 && (
          <Link
            href="/spl/invoices"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 hover:bg-red-100/70"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <span>
              <strong>
                {invoices.overdueCount} overdue invoice{invoices.overdueCount === 1 ? "" : "s"}
              </strong>{" "}
              totalling {formatMoney(invoices.overdueTotal, invoices.currency)}. View invoices
            </span>
          </Link>
        )}

        {/* Case pipeline */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href="/spl/cases" className="group">
              <Card className="border-0 shadow-sm transition-shadow group-hover:shadow-md">
                <CardContent className="p-5 flex items-center gap-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.tone}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-[#0D1F3C] tabular-nums">{s.value}</p>
                    <p className="text-sm text-gray-500 truncate">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active contract */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#0D1F3C]">
                <Briefcase className="h-4 w-4 text-[#0A6E75]" />
                Active contract
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {contract ? (
                <>
                  <div>
                    <p className="font-semibold text-[#0D1F3C]">{contract.title}</p>
                    <p className="text-gray-500">
                      {MODEL_LABELS[contract.model] ?? humanize(contract.model)}
                      {contract.endDate ? ` · until ${formatDate(contract.endDate)}` : ""}
                    </p>
                  </div>
                  {volume ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-600">
                        <span>
                          Cases used this {PERIOD_LABELS[contract.subscriptionPeriod ?? ""] ?? "period"}
                        </span>
                        <span className="font-medium text-[#0D1F3C] tabular-nums">
                          {used} / {volume}
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full bg-gray-100 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={used}
                        aria-valuemin={0}
                        aria-valuemax={volume}
                        aria-label="Subscribed cases used"
                      >
                        <div
                          className={`h-full rounded-full ${usedPct >= 90 ? "bg-amber-500" : "bg-[#0A6E75]"}`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                      <p className="text-gray-500">
                        {contract.casesRemainingThisPeriod ?? Math.max(0, volume - used)} remaining
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Billed per case, no volume cap.</p>
                  )}
                  <Link href="/spl/contracts" className="inline-flex items-center gap-1 font-medium text-[#0A6E75] hover:underline">
                    View contracts <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">No active contract.</p>
                  <p className="text-gray-500">Contact the DFC secretariat to set up or renew your contract.</p>
                  <Link href="/spl/contracts" className="inline-flex items-center gap-1 font-medium text-[#0A6E75] hover:underline">
                    View contracts <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unpaid invoices */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#0D1F3C]">
                <Receipt className="h-4 w-4 text-[#0A6E75]" />
                Unpaid invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-2xl font-bold text-[#0D1F3C] tabular-nums">
                  {formatMoney(invoices.unpaidTotal, invoices.currency)}
                </p>
                <p className="text-gray-500">
                  {invoices.unpaidCount === 0
                    ? "Nothing outstanding"
                    : `${invoices.unpaidCount} invoice${invoices.unpaidCount === 1 ? "" : "s"} outstanding`}
                </p>
              </div>
              {invoices.upcoming.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {invoices.upcoming.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0D1F3C] truncate">{inv.invoiceNumber}</p>
                        <p className={inv.isOverdue ? "text-red-600" : "text-gray-500"}>
                          {inv.isOverdue ? "Overdue since" : "Due"} {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatMoney(inv.total, invoices.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/spl/invoices" className="inline-flex items-center gap-1 font-medium text-[#0A6E75] hover:underline">
                View invoices <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Recent cases */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-[#0D1F3C]">
                <FileText className="h-4 w-4 text-[#0A6E75]" />
                Recent cases
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {data.recentCases.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-500">No cases yet.</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/spl/cases/new")}
                    className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white"
                  >
                    Submit your first case
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100">
                    {data.recentCases.map((c) => (
                      <li key={c.id}>
                        <Link href={`/spl/cases/${c.id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 -mx-2 px-2 rounded-md">
                          <div className="min-w-0">
                            <p className="font-medium text-[#0D1F3C] truncate">{c.referenceNumber}</p>
                            <p className="text-gray-500 truncate">
                              {SERVICE_TYPE_LABELS[c.serviceType] ?? humanize(c.serviceType)} · {c.specialty}
                            </p>
                          </div>
                          <Badge className={`shrink-0 border-0 ${STATUS_BADGE_STYLES[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {humanize(c.status)}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/spl/cases" className="mt-3 inline-flex items-center gap-1 font-medium text-[#0A6E75] hover:underline">
                    View all cases <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
