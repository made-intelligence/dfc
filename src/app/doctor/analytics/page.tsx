"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface AnalyticsData {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    appointments: number;
  }>;
  appointmentStats: Array<{
    status: string;
    count: number;
  }>;
  patientMetrics: {
    totalAppointments: number;
    uniquePatients: number;
    returningPatients: number;
  };
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  topDays: Array<{
    date: string;
    appointments: number;
  }>;
}

export default function DoctorAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/doctor/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <Loading />;
  if (!analytics) return <div>Failed to load analytics</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Insights into your practice performance</p>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend (Last 6 Months)
          </CardTitle>
          <CardDescription>Monthly revenue and appointment volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyRevenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{month.month}</div>
                  <div className="text-sm text-gray-600">{month.appointments} appointments</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">₦{month.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Appointment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Appointment Status
            </CardTitle>
            <CardDescription>Current month breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.appointmentStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge className={getStatusColor(stat.status)}>
                    {stat.status.toLowerCase()}
                  </Badge>
                  <span className="font-medium">{stat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Metrics
            </CardTitle>
            <CardDescription>This month's patient data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Appointments</span>
                <span className="font-bold">{analytics.patientMetrics.totalAppointments}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Patients</span>
                <span className="font-bold">{analytics.patientMetrics.uniquePatients}</span>
              </div>
              <div className="flex justify-between">
                <span>Returning Patients</span>
                <span className="font-bold">{analytics.patientMetrics.returningPatients}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Return Rate</span>
                  <span>
                    {analytics.patientMetrics.totalAppointments > 0
                      ? Math.round((analytics.patientMetrics.returningPatients / analytics.patientMetrics.totalAppointments) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Hours
            </CardTitle>
            <CardDescription>Most popular appointment times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{hour.hour}:00 - {hour.hour + 1}:00</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Top Performing Days
            </CardTitle>
            <CardDescription>Days with most appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{new Date(day.date).toLocaleDateString()}</span>
                  <Badge variant="outline">{day.appointments} appointments</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}