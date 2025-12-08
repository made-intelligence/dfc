"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Loading } from "@/components/ui/loading";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPatientDetails(params.id as string);
    }
  }, [params.id]);

  const fetchPatientDetails = async (patientId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${patientId}`);
      const data = await response.json();
      setPatient(data);
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading type="pulse" size="lg" />;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Patient Details</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold mb-2">{patient.name}</h2>
                  <Badge variant="secondary" className="mb-2">Patient</Badge>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                    <div className="break-all">
                      <span className="font-medium">Email:</span> {patient.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {patient.phone || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Date of Birth:</span> {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {patient.gender || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              {patient.address && (
                <div>
                  <h3 className="font-medium mb-2">Address</h3>
                  <p className="text-gray-600">{patient.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {patient.medicalHistory?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.medicalHistory.map((record: any) => (
                    <div
                      key={record.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-2">
                        <span className="font-medium">{record.condition}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Total Appointments:</span>
                <span className="font-medium">{patient.totalAppointments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Last Visit:</span>
                <span className="font-medium text-sm sm:text-base">
                  {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Status:</span>
                <Badge variant={patient.isActive ? "default" : "secondary"}>
                  {patient.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {patient.recentAppointments?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.recentAppointments.slice(0, 5).map((apt: any) => (
                    <div
                      key={apt.id}
                      className="flex flex-col sm:flex-row sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-sm sm:text-base">{apt.doctor}</span>
                        <p className="text-xs sm:text-sm text-gray-600">{apt.specialty}</p>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 sm:text-right">
                        {new Date(apt.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}