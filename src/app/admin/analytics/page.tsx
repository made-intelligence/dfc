"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Activity,
  Download,
} from "lucide-react";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    revenueGrowth: number;
    newPatients: number;
    patientGrowth: number;
    totalAppointments: number;
    appointmentGrowth: number;
    completionRate: number;
  };
  topSpecialties: Array<{
    specialty: string;
    count: number;
  }>;
  peakHours: Array<{
    time: string;
    appointments: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  userGrowthData: Array<{
    month: string;
    users: number;
  }>;
  availableYears: number[];
}

interface SystemHealth {
  status: string;
  database: { status: string; latencyMs: number | null };
  email?: { transport: string; sent24h: number; failed24h: number };
  payments?: { configured: boolean };
  metrics?: { totalUsers: number; totalDoctors: number; totalAppointments: number; openTickets: number };
}

/** Quote a value for CSV. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetch("/api/admin/system-health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const exportReport = () => {
    if (!analytics) return;
    const m = analytics.metrics;
    const rows: (string | number)[][] = [
      [`DFC analytics report — ${selectedYear ?? ""}`],
      [],
      ["Metric", "Value"],
      ["Total revenue (NGN)", m.totalRevenue],
      ["Revenue growth vs last month (%)", m.revenueGrowth.toFixed(1)],
      ["New members", m.newPatients],
      ["Member growth vs last month (%)", m.patientGrowth.toFixed(1)],
      ["Appointments", m.totalAppointments],
      ["Appointment growth vs last month (%)", m.appointmentGrowth.toFixed(1)],
      ["Completion rate (%)", m.completionRate.toFixed(1)],
      [],
      ["Month", "Revenue (NGN)", "New users"],
      ...analytics.revenueData.map((r, i) => [r.month, r.revenue, analytics.userGrowthData[i]?.users ?? ""]),
      [],
      ["Specialty", "Members"],
      ...analytics.topSpecialties.map((s) => [s.specialty, s.count]),
      [],
      ["Time", "Appointments"],
      ...analytics.peakHours.map((h) => [h.time, h.appointments]),
    ];
    downloadCsv(`dfc-analytics-${selectedYear ?? "report"}.csv`, rows);
  };

  useEffect(() => {
    if (selectedYear) {
      fetchAnalytics();
    } else {
      fetchInitialData();
    }
  }, [selectedYear]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      const data: AnalyticsData = await response.json();
      setAnalytics(data);
      setSelectedYear(data.availableYears[data.availableYears.length - 1]); // Set to latest year
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?year=${selectedYear}`);
      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-48 mt-2 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
                  <div className="h-8 bg-gray-300 rounded w-16 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="p-6">
                <div className="h-64 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{animation: 'shimmer 2s infinite'}} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  if (!analytics) {
    return <div>Failed to load analytics data</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Platform performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear?.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {analytics?.availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₦{analytics.metrics.totalRevenue.toLocaleString()}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    analytics.metrics.revenueGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analytics.metrics.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {analytics.metrics.revenueGrowth >= 0 ? "+" : ""}
                  {analytics.metrics.revenueGrowth.toFixed(1)}% from last month
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">₦</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Members</p>
                <p className="text-2xl font-bold">
                  {analytics.metrics.newPatients}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    analytics.metrics.patientGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analytics.metrics.patientGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {analytics.metrics.patientGrowth >= 0 ? "+" : ""}
                  {analytics.metrics.patientGrowth.toFixed(1)}% from last month
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-2xl font-bold">
                  {analytics.metrics.totalAppointments}
                </p>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    analytics.metrics.appointmentGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analytics.metrics.appointmentGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {analytics.metrics.appointmentGrowth >= 0 ? "+" : ""}
                  {analytics.metrics.appointmentGrowth.toFixed(1)}% from last
                  month
                </div>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.metrics.completionRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 p-4">
              <div className="flex items-end justify-between h-full space-x-2">
                {analytics.revenueData.map((item, i) => {
                  const maxRevenue = Math.max(...analytics.revenueData.map(d => d.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className="w-full flex items-end justify-center mb-2" style={{ height: '180px' }}>
                        <div
                          className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600 relative group"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            ₦{item.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 p-4">
              <div className="relative h-full">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  <defs>
                    <linearGradient id="userGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {analytics.userGrowthData.length > 0 && (() => {
                    const maxUsers = Math.max(...analytics.userGrowthData.map(d => d.users));
                    const points = analytics.userGrowthData.map((item, i) => {
                      const x = (i / (analytics.userGrowthData.length - 1)) * 350 + 25;
                      const y = 180 - (maxUsers > 0 ? (item.users / maxUsers) * 140 : 0);
                      return `${x},${y}`;
                    }).join(' ');
                    const areaPoints = `25,180 ${points} ${350 + 25},180`;
                    return (
                      <>
                        <polygon points={areaPoints} fill="url(#userGradient)" />
                        <polyline
                          points={points}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {analytics.userGrowthData.map((item, i) => {
                          const x = (i / (analytics.userGrowthData.length - 1)) * 350 + 25;
                          const y = 180 - (maxUsers > 0 ? (item.users / maxUsers) * 140 : 0);
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="4" fill="#10b981" />
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="12" 
                                fill="transparent" 
                                style={{ cursor: 'pointer' }}
                              >
                                <title>{item.users} users in {item.month}</title>
                              </circle>
                              <text x={x} y="195" textAnchor="middle" className="text-xs fill-gray-600">
                                {item.month}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSpecialties.map((item, i) => {
                const total = analytics.topSpecialties.reduce(
                  (sum, s) => sum + s.count,
                  0,
                );
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.specialty}</p>
                      <p className="text-sm text-gray-600">
                        {item.count} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{percentage.toFixed(1)}%</p>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.peakHours.map((item, i) => {
                const maxAppointments = Math.max(
                  ...analytics.peakHours.map((h) => h.appointments),
                );
                const percentage =
                  maxAppointments > 0
                    ? (item.appointments / maxAppointments) * 100
                    : 0;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-sm">{item.time}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-green-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {item.appointments}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {!health ? (
              <p className="text-sm text-gray-500">Health check unavailable.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <span
                    className={`font-medium capitalize ${
                      health.database.status === "operational" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {health.database.status}
                    {health.database.latencyMs != null && ` · ${health.database.latencyMs}ms`}
                  </span>
                </div>
                {health.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emails (24h)</span>
                    <span className="font-medium">
                      {health.email.sent24h} sent
                      {health.email.failed24h > 0 && (
                        <span className="text-red-600"> · {health.email.failed24h} failed</span>
                      )}
                    </span>
                  </div>
                )}
                {health.payments && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payments (Paystack)</span>
                    <span
                      className={`font-medium ${health.payments.configured ? "text-green-600" : "text-red-600"}`}
                    >
                      {health.payments.configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                )}
                {health.metrics && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Registered users</span>
                      <span className="font-medium">{health.metrics.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open secretariat tickets</span>
                      <span className="font-medium">{health.metrics.openTickets}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
