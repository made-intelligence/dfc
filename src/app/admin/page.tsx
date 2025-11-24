'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Hospital, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Shield, Upload, Loader2 } from "lucide-react";
import { useScrollAnimation } from '@/lib/useScrollAnimation';
import { useCountUp } from '@/lib/useCountUp';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: appointmentsRef, isVisible: appointmentsVisible } = useScrollAnimation();
  const { ref: doctorsRef, isVisible: doctorsVisible } = useScrollAnimation();
  const { ref: systemRef, isVisible: systemVisible } = useScrollAnimation();
  
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await fetch('/api/admin/import-doctors', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Successfully imported ${result.imported} doctors`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const patientsCount = useCountUp({ end: 10234, isVisible: statsVisible, duration: 2500 });
  const activeDoctorsCount = useCountUp({ end: 523, isVisible: statsVisible, duration: 2000 });
  const appointmentsCount = useCountUp({ end: 156, isVisible: statsVisible, duration: 1500 });
  
  if (!user) return null;
  
  const isSuperAdmin = user.role === 'SUPERADMIN';
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </Badge>
              </div>
              <p className="text-gray-600">
                {isSuperAdmin ? "Full system control and management" : "Manage your medical platform"}
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
                onClick={() => document.getElementById('csv-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Doctors
              </Button>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Doctor
              </Button>
              {isSuperAdmin && (
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
        <div ref={statsRef} className={`grid md:grid-cols-4 gap-4 mb-8 animate-fade-up ${statsVisible ? 'visible' : ''}`}>
          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientsCount.toLocaleString()}</div>
              {/* <p className="text-xs text-muted-foreground">
                +12% from last month
              </p> */}
            </CardContent>
          </Card>

          <Card className="transition-all duration-500 hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Doctors</CardTitle>
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
              <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
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
              <div className="text-2xl font-bold">₦2.4M</div>
              {/* <p className="text-xs text-muted-foreground">
                +15% from last month
              </p> */}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Appointments */}
          <Card ref={appointmentsRef} className={`animate-fade-up ${appointmentsVisible ? 'visible' : ''}`}>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Latest appointment bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { patient: "John Doe", doctor: "Dr. Smith", time: "10:00 AM", status: "confirmed" },
                  { patient: "Jane Smith", doctor: "Dr. Johnson", time: "11:30 AM", status: "pending" },
                  { patient: "Mike Wilson", doctor: "Dr. Brown", time: "2:00 PM", status: "completed" },
                  { patient: "Sarah Davis", doctor: "Dr. Lee", time: "3:30 PM", status: "cancelled" },
                ].map((appointment, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{appointment.patient}</div>
                      <div className="text-sm text-gray-600">with {appointment.doctor}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{appointment.time}</div>
                      <Badge 
                        variant={
                          appointment.status === 'confirmed' ? 'default' :
                          appointment.status === 'pending' ? 'secondary' :
                          appointment.status === 'completed' ? 'default' : 'destructive'
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
          <Card ref={doctorsRef} className={`animate-fade-up ${doctorsVisible ? 'visible' : ''}`}>
            <CardHeader>
              <CardTitle>Top Performing Doctors</CardTitle>
              <CardDescription>Based on patient ratings and appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Dr. Sarah Johnson", specialty: "Cardiology", rating: 4.9, appointments: 45 },
                  { name: "Dr. Michael Brown", specialty: "Neurology", rating: 4.8, appointments: 38 },
                  { name: "Dr. Emily Davis", specialty: "Pediatrics", rating: 4.9, appointments: 52 },
                  { name: "Dr. James Wilson", specialty: "Orthopedics", rating: 4.7, appointments: 33 },
                ].map((doctor, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-sm text-gray-600">{doctor.specialty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">⭐ {doctor.rating}</div>
                      <div className="text-xs text-gray-600">{doctor.appointments} appointments</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card ref={systemRef} className={`animate-fade-up ${systemVisible ? 'visible' : ''}`}>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Database</div>
                  <div className="text-sm text-green-700">Operational</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">API Response</div>
                  <div className="text-sm text-yellow-700">Slow (850ms)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">Payment Gateway</div>
                  <div className="text-sm text-green-700">Operational</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}