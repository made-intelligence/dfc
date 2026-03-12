"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Building,
  Briefcase,
  FileText,
  Receipt,
  ArrowRight,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from "lucide-react";

interface OverviewStats {
  totalPartners: number;
  activeContracts: number;
  openCases: number;
  revenueThisMonth: number;
}

const NAV_CARDS = [
  {
    title: "Partners",
    href: "/admin/spl/partners",
    icon: Building,
    description: "Manage HMO and corporate partners",
    countKey: "totalPartners" as const,
  },
  {
    title: "All Cases",
    href: "/admin/spl/cases",
    icon: Briefcase,
    description: "View and manage all SPL cases",
    countKey: "openCases" as const,
  },
  {
    title: "Contracts",
    href: "/admin/spl/contracts",
    icon: FileText,
    description: "Create and manage partner contracts",
    countKey: "activeContracts" as const,
  },
  {
    title: "Invoices",
    href: "/admin/spl/invoices",
    icon: Receipt,
    description: "Invoice management and payment tracking",
    countKey: null,
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function SPLOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/spl/overview", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {
        console.error("Failed to fetch SPL overview");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const summaryCards = [
    {
      label: "Total Partners",
      value: stats?.totalPartners ?? 0,
      icon: Users,
      color: "bg-[#0D1F3C]",
      textColor: "text-white",
      iconColor: "text-white/70",
    },
    {
      label: "Active Contracts",
      value: stats?.activeContracts ?? 0,
      icon: CheckCircle2,
      color: "bg-emerald-50",
      textColor: "text-gray-900",
      iconColor: "text-emerald-600",
    },
    {
      label: "Open Cases",
      value: stats?.openCases ?? 0,
      icon: AlertCircle,
      color: "bg-amber-50",
      textColor: "text-gray-900",
      iconColor: "text-amber-600",
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(stats?.revenueThisMonth ?? 0),
      icon: DollarSign,
      color: "bg-[#0A6E75]/10",
      textColor: "text-gray-900",
      iconColor: "text-[#0A6E75]",
    },
  ];

  return (
    <DashboardLayout title="SPL Management">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "#0D1F3C" }}
          >
            Specialist Partners
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage HMO and corporate partner relationships, cases, contracts,
            and invoices.
          </p>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading overview...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              const isNavy = card.color === "bg-[#0D1F3C]";
              return (
                <div
                  key={card.label}
                  className={`rounded-xl border p-5 ${card.color} ${
                    isNavy ? "border-transparent" : "border-gray-200"
                  }`}
                  style={isNavy ? { backgroundColor: "#0D1F3C" } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          isNavy ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {card.label}
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          isNavy ? "text-white" : card.textColor
                        }`}
                      >
                        {card.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            const count =
              card.countKey && stats ? stats[card.countKey] : undefined;
            return (
              <button
                key={card.title}
                onClick={() => router.push(card.href)}
                className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-[#0A6E75] hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "#0A6E75" }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {count !== undefined && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {count}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {card.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-[#0A6E75] opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
