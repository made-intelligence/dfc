"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  thisMonthRevenue: number;
  avgRating: number;
  totalRatings: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  patient: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  todaySchedule: Appointment[];
  upcomingAppointments: Appointment[];
  recentActivity: Appointment[];
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { todayAppointments: 0, totalPatients: 0, thisMonthRevenue: 0, avgRating: 0, totalRatings: 0 },
    todaySchedule: [],
    upcomingAppointments: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching dashboard data...');
        const response = await fetch("/api/doctor/dashboard");
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard data:', data);
          setDashboardData(data);
          setError(null);
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          setError(errorData.error || 'Failed to load dashboard');
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return <Loading />;
  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}</h1>
        <p className="text-blue-100">
          Here's what's happening with your practice today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.todaySchedule.length} scheduled today
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Unique patients served</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{dashboardData.stats.thisMonthRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month's earnings
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {dashboardData.stats.totalRatings} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your appointments for today</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for today
                </div>
              ) : (
                dashboardData.todaySchedule.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(`1970-01-01T${appointment.startTime}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {appointment.patient.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.patient.email}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        appointment.status === "CONFIRMED"
                          ? "default"
                          : appointment.status === "PENDING"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {appointment.status.toLowerCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent activity
                </div>
              ) : (
                dashboardData.recentActivity.map((activity) => {
                  const getActivityIcon = (status: string) => {
                    switch (status) {
                      case "COMPLETED":
                        return { icon: CheckCircle, type: "success" };
                      case "CONFIRMED":
                        return { icon: Calendar, type: "info" };
                      case "PENDING":
                        return { icon: Clock, type: "warning" };
                      default:
                        return { icon: AlertCircle, type: "info" };
                    }
                  };

                  const { icon: Icon, type } = getActivityIcon(activity.status);
                  const timeAgo = new Date(activity.appointmentDate).toLocaleDateString();

                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          type === "success"
                            ? "bg-green-100 text-green-600"
                            : type === "warning"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          Appointment with {activity.patient.name} - {activity.status.toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button 
              className="h-20 flex-col space-y-2"
              onClick={() => router.push('/doctor/schedule')}
            >
              <Calendar className="h-6 w-6" />
              <span>Manage Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => router.push('/doctor/patients')}
            >
              <Users className="h-6 w-6" />
              <span>View Patients</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => router.push('/doctor/appointments')}
            >
              <Clock className="h-6 w-6" />
              <span>Appointments</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => router.push('/doctor/profile')}
            >
              <DollarSign className="h-6 w-6" />
              <span>Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
