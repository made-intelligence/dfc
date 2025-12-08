"use client";

import { useState, useEffect } from "react";
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
import {
  Users,
  Calendar,
  Hospital,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Shield,
  Upload,
  Loader2,
} from "lucide-react";
import { Loading, CardSkeleton } from "@/components/ui/loading";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { useCountUp } from "@/lib/useCountUp";
import { useToast } from "@/components/ui/toast";
import AddDoctorModal from "@/components/admin/AddDoctorModal";


export default function AdminDashboard() {
  const { user } = useAuth();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: appointmentsRef, isVisible: appointmentsVisible } =
    useScrollAnimation();
  const { ref: doctorsRef, isVisible: doctorsVisible } = useScrollAnimation();
  const { ref: systemRef, isVisible: systemVisible } = useScrollAnimation();

  const [uploading, setUploading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const { addToast } = useToast()


  useEffect(() => {
    fetchDashboardData();
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`/api/admin/user-permissions?userId=${user.id}`);
      const data = await response.json();
      setUserPermissions(data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    }
  };

  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission) || user?.role === 'SUPERADMIN';
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Fallback data if API fails
        setDashboardData({
          stats: {
            totalPatients: 0,
            activeDoctors: 0,
            todayAppointments: 0,
            monthlyRevenue: 0
          },
          recentAppointments: [],
          topDoctors: [],
          systemHealth: {
            database: "operational",
            apiResponse: "operational",
            paymentGateway: "operational"
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Fallback data on error
      setDashboardData({
        stats: {
          totalPatients: 0,
          activeDoctors: 0,
          todayAppointments: 0,
          monthlyRevenue: 0
        },
        recentAppointments: [],
        topDoctors: [],
        systemHealth: {
          database: "operational",
          apiResponse: "operational",
          paymentGateway: "operational"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await fetch("/api/admin/import-doctors", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
               addToast({
          type: "success",
          title: "Doctors Imported",
          description: `Successfully imported ${result.imported} doctors`
        })
      } else {
              addToast({
        type: "error",
        title: "Error",
        description: `${result.error}`
      })
      }
    } catch (error) {
                   addToast({
        type: "error",
        title: "Error",
        description: `Failed to upload file`
      })
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Simplified - show data directly without animations
  const patientsCount = dashboardData?.stats?.totalPatients || 0;
  const activeDoctorsCount = dashboardData?.stats?.activeDoctors || 0;
  const appointmentsCount = dashboardData?.stats?.todayAppointments || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isSuperAdmin = user?.role === "SUPERADMIN";
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </Badge>
              </div>
              <p className="text-gray-600">
                {isSuperAdmin
                  ? "Full system control and management"
                  : "Manage your medical platform"}
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("csv-upload")?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Doctors
              </Button>
              <Button onClick={() => setShowAddDoctorModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Doctor
              </Button>
              {hasPermission('manage_admins') && (
                <Button variant="secondary">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Admins
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="py-6">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patientsCount.toLocaleString()}
              </div>
              {/* <p className="text-xs text-muted-foreground">
                +12% from last month
              </p> */}
            </CardContent>
          </Card>

          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Doctors
              </CardTitle>
              <Hospital className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDoctorsCount}</div>
              {/* <p className="text-xs text-muted-foreground">
                +8% from last month
              </p> */}
            </CardContent>
          </Card>

          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Appointments Today
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointmentsCount}</div>
              {/* <p className="text-xs text-muted-foreground">
                +23% from yesterday
              </p> */}
            </CardContent>
          </Card>

          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{((dashboardData?.stats?.monthlyRevenue || 0) / 100).toLocaleString()}
              </div>
              {/* <p className="text-xs text-muted-foreground">
                +15% from last month
              </p> */}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Latest appointment bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(dashboardData?.recentAppointments || []).map((appointment: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{appointment.patient}</div>
                      <div className="text-sm text-gray-600">
                        with {appointment.doctor}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {appointment.time}
                      </div>
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "pending"
                              ? "secondary"
                              : appointment.status === "completed"
                                ? "default"
                                : "destructive"
                        }
                        className="text-xs"
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Doctors</CardTitle>
              <CardDescription>
                Based on patient ratings and appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(dashboardData?.topDoctors || []).map((doctor: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-gray-600">
                        {doctor.specialty}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ⭐ {doctor.rating}
                      </div>
                      <div className="text-xs text-gray-600">
                        {doctor.appointments} appointments
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Database</div>
                  <div className="text-sm text-green-700">
                    {dashboardData?.systemHealth?.database || "Operational"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">
                    API Response
                  </div>
                  <div className="text-sm text-green-700">
                    {dashboardData?.systemHealth?.apiResponse || "Operational"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">
                    Payment Gateway
                  </div>
                  <div className="text-sm text-green-700">
                    {dashboardData?.systemHealth?.paymentGateway || "Operational"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <AddDoctorModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onSuccess={() => {
          fetchDashboardData();
          addToast({
            type: "success",
            title: "Doctor Created",
            description: "New doctor has been successfully added"
          });
        }}
      />
    </div>
  );
}
