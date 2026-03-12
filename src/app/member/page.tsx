"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertTriangle,
  CheckCircle,
  Bell,
  Users,
  FileText,
  CreditCard,
  Info,
  ChevronRight,
  Shield,
  Stethoscope,
  Calendar,
  FolderOpen,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  getCategoryLabel,
  getDuesStatusLabel,
  getExcoLabel,
  formatDateLong,
  formatMonthYear,
} from "@/lib/utils/member";

interface DashboardData {
  dfcMember: {
    category: string;
    status: string;
    goodStanding: boolean;
    duesStatus: string;
    duesExpiresAt: string | null;
    lastDuesPaidAt: string | null;
    createdAt: string;
    excoPosition: string | null;
    excoTermEnd: string | null;
    isBotMember: boolean;
  };
  committeesCount: number;
  openTicketsCount: number;
  committees: {
    id: string;
    role: string;
    initiative: { name: string; type: string; status: string };
    pillar: { name: string } | null;
  }[];
  standingCommittees: {
    id: string;
    role: string;
    committeeName: string;
    shortCode: string;
  }[];
  recentTickets: {
    id: string;
    requestType: string | null;
    subject: string | null;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
  }[];
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="h-20 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/member/dashboard", { credentials: "include" })
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const surname = user?.name?.split(" ").pop() || "";

  if (loading) return <SkeletonDashboard />;

  const dfcMember = data?.dfcMember;
  const duesStatus = dfcMember?.duesStatus || "NOT_YET_DUE";

  const ticketStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: "bg-red-50 text-red-700 border-red-200",
      IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
      AWAITING_MEMBER: "bg-blue-50 text-blue-700 border-blue-200",
      COMPLETED: "bg-green-50 text-green-700 border-green-200",
      CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
    };
    const labels: Record<string, string> = {
      OPEN: "Open",
      IN_PROGRESS: "In progress",
      AWAITING_MEMBER: "Awaiting you",
      COMPLETED: "Completed",
      CLOSED: "Closed",
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const unreadNotifications = data?.notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0D1F3C]">
              {getGreeting()}, Dr. {surname}
            </h1>
            {dfcMember?.excoPosition && (
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#0D1F3C] text-white">
                {getExcoLabel(dfcMember.excoPosition)}
              </span>
            )}
            {dfcMember?.isBotMember && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0A6E75] text-white">
                BOT
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {dfcMember ? getCategoryLabel(dfcMember.category) : "Member"} &middot; Since{" "}
            {dfcMember ? formatMonthYear(dfcMember.createdAt) : "—"}
          </p>
        </div>

        {/* Quick switch to clinical */}
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6E75] text-white text-sm font-medium hover:bg-[#0A6E75]/90 transition-colors shadow-sm"
        >
          <Stethoscope className="h-4 w-4" />
          Clinical Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Dues Status Banner */}
      {duesStatus === "PAID" || duesStatus === "WAIVED" ? (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-800">Membership in good standing</p>
            {dfcMember?.duesExpiresAt && (
              <p className="text-sm text-green-700 mt-0.5">
                Valid until {formatDateLong(dfcMember.duesExpiresAt)}
              </p>
            )}
          </div>
        </div>
      ) : duesStatus === "OUTSTANDING" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Annual dues are outstanding</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Some features are restricted until dues are paid.
            </p>
          </div>
          <Link
            href="/member/dues"
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Pay now <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-blue-800">Welcome to DFC</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Your first dues cycle has not started yet. You will be notified when dues become due.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0D1F3C]/5 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-[#0D1F3C]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Standing</span>
          </div>
          <p
            className={`text-lg font-bold ${dfcMember?.goodStanding ? "text-green-700" : "text-amber-600"}`}
          >
            {dfcMember?.goodStanding ? "Good" : "Pending"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{getDuesStatusLabel(duesStatus)}</p>
        </div>

        <Link
          href="/member/dues"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0A6E75]/30 transition-colors group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A6E75]/5 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-[#0A6E75]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Dues</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {duesStatus === "PAID" ? "Paid" : duesStatus === "OUTSTANDING" ? "Due" : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 group-hover:text-[#0A6E75] transition-colors">
            Manage dues →
          </p>
        </Link>

        <Link
          href="/member/initiatives"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0A6E75]/30 transition-colors group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A6E75]/5 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-[#0A6E75]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Committees</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{data?.committeesCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5 group-hover:text-[#0A6E75] transition-colors">
            View all →
          </p>
        </Link>

        <Link
          href="/member/secretariat"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0A6E75]/30 transition-colors group"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A6E75]/5 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-[#0A6E75]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Requests</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{data?.openTicketsCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5 group-hover:text-[#0A6E75] transition-colors">
            Open requests →
          </p>
        </Link>
      </div>

      {/* Quick Clinical Access */}
      <div className="bg-gradient-to-r from-[#0D1F3C] to-[#0D1F3C]/90 rounded-xl p-5 mb-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Stethoscope className="h-5 w-5 text-white/80" />
          <h2 className="text-sm font-semibold text-white">Quick Clinical Access</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/doctor/emr", icon: FolderOpen, label: "Patient Records" },
            { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
            { href: "/doctor/schedule", icon: Clock, label: "My Schedule" },
            { href: "/member/cases", icon: FileText, label: "My Cases" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-white"
            >
              <item.icon className="h-4 w-4 text-white/70" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* My Committees */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0D1F3C] flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              My Committees
            </h2>
            <Link
              href="/member/initiatives"
              className="text-xs text-[#0A6E75] hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          {!data?.committees?.length && !data?.standingCommittees?.length ? (
            <div className="p-6 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No committee assignments yet</p>
              <Link
                href="/member/initiatives"
                className="text-xs text-[#0A6E75] hover:underline mt-1 inline-block"
              >
                Browse available committees
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data?.standingCommittees?.map((sc) => (
                <div key={sc.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sc.committeeName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">Standing Committee</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0A6E75]/10 text-[#0A6E75] shrink-0 ml-3">
                    {sc.role.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
              {data?.committees?.slice(0, 4 - (data?.standingCommittees?.length || 0)).map((c) => (
                <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {c.initiative.name}
                    </p>
                    {c.pillar && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{c.pillar.name}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#0D1F3C]/5 text-[#0D1F3C] shrink-0 ml-3">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0D1F3C] flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              Recent Requests
            </h2>
            <Link
              href="/member/secretariat"
              className="text-xs text-[#0A6E75] hover:underline font-medium"
            >
              View all
            </Link>
          </div>
          {!data?.recentTickets?.length ? (
            <div className="p-6 text-center">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No requests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentTickets.slice(0, 4).map((t) => (
                <div key={t.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.requestType || t.subject || "General enquiry"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateLong(t.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">{ticketStatusBadge(t.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-[#0D1F3C] text-sm">Notifications</h2>
          {unreadNotifications > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              {unreadNotifications} new
            </span>
          )}
        </div>
        {!data?.notifications?.length ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={`px-5 py-3.5 ${!n.isRead ? "bg-blue-50/40" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      !n.isRead ? "bg-blue-500" : "bg-transparent"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
