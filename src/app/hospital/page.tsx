"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Clock, Activity } from "lucide-react";

interface DashboardData {
  stats: {
    activeDeployments: number;
    verifiedSpecialists: number;
    pendingVerifications: number;
    totalVisitsThisMonth: number;
  };
  recentDeployments: {
    id: string;
    title: string;
    specialty: string;
    startDate: string;
    endDate: string;
    status: string;
  }[];
  pendingVerifications: {
    id: string;
    specialistName: string;
    specialty: string;
    status: string;
  }[];
}

const statusBadge: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  UNVERIFIED: "bg-gray-100 text-gray-600",
};

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#0D1F3C] mt-1">
              {value}
            </p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-[#0A4A50]/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-[#0A4A50]" />
        </div>
      </div>
    </div>
  );
}

export default function HospitalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/hospital/dashboard");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {
    activeDeployments: 0,
    verifiedSpecialists: 0,
    pendingVerifications: 0,
    totalVisitsThisMonth: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
          Dashboard
        </h2>
        <p className="text-gray-500 mt-1">
          Overview of your hospital partnership activity
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Deployments"
          value={stats.activeDeployments}
          icon={Calendar}
          loading={loading}
        />
        <StatCard
          title="Verified Specialists"
          value={stats.verifiedSpecialists}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Total Visits This Month"
          value={stats.totalVisitsThisMonth}
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="font-serif font-semibold text-[#0D1F3C]">
              Recent Deployment Windows
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : data?.recentDeployments && data.recentDeployments.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Specialty</th>
                    <th className="px-6 py-3 font-medium">Dates</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentDeployments.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-[#0D1F3C]">
                        {d.title}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {d.specialty}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(d.startDate).toLocaleDateString()} –{" "}
                        {new Date(d.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[d.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No deployment windows yet. Request your first deployment to get
                started.
              </div>
            )}
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="font-serif font-semibold text-[#0D1F3C]">
              Pending Verification Requests
            </h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : data?.pendingVerifications &&
            data.pendingVerifications.length > 0 ? (
            <ul className="divide-y">
              {data.pendingVerifications.map((v) => (
                <li key={v.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#0D1F3C]">
                        {v.specialistName}
                      </p>
                      <p className="text-sm text-gray-500">{v.specialty}</p>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[v.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      {v.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No pending verification requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
