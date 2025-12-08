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
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Calendar, MapPin, Search, Eye } from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  patientProfile: {
    dateOfBirth: string;
    gender: string;
    address: string;
    bloodGroup: string;
    allergies: string;
    emergencyContact: string;
  };
  _count: {
    appointments: number;
  };
  lastAppointment?: {
    appointmentDate: string;
    status: string;
  };
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/doctor/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm),
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Patients</h1>
          <p className="text-gray-600">
            Manage your patient records and information
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total Patients: {patients.length}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-lg">
                        {patient.name}
                      </span>
                    </div>
                    {patient.patientProfile?.gender && (
                      <Badge variant="outline">
                        {patient.patientProfile.gender}
                      </Badge>
                    )}
                    {patient.patientProfile?.dateOfBirth && (
                      <Badge variant="secondary">
                        {calculateAge(patient.patientProfile.dateOfBirth)} years
                      </Badge>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{patient.email}</span>
                    </div>
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.patientProfile?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {patient.patientProfile.address}
                        </span>
                      </div>
                    )}
                    {patient.patientProfile?.bloodGroup && (
                      <div>
                        <span className="font-medium">Blood Group: </span>
                        <span>{patient.patientProfile.bloodGroup}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-medium">Total Appointments: </span>
                      <span className="text-blue-600">
                        {patient._count.appointments}
                      </span>
                    </div>
                    {patient.lastAppointment && (
                      <div>
                        <span className="font-medium">Last Visit: </span>
                        <span>
                          {new Date(
                            patient.lastAppointment.appointmentDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {patient.patientProfile?.allergies && (
                    <div className="mt-3 p-2 bg-red-50 rounded-md">
                      <span className="font-medium text-red-800 text-sm">
                        Allergies:{" "}
                      </span>
                      <span className="text-red-700 text-sm">
                        {JSON.parse(patient.patientProfile.allergies).join(
                          ", ",
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPatients.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No patients found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Your patients will appear here once they book appointments with you"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Patient Details
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedPatient.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedPatient.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedPatient.phone}
                    </div>
                    {selectedPatient.patientProfile?.dateOfBirth && (
                      <div>
                        <span className="font-medium">Age:</span>{" "}
                        {calculateAge(
                          selectedPatient.patientProfile.dateOfBirth,
                        )}{" "}
                        years
                      </div>
                    )}
                    {selectedPatient.patientProfile?.gender && (
                      <div>
                        <span className="font-medium">Gender:</span>{" "}
                        {selectedPatient.patientProfile.gender}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medical Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPatient.patientProfile?.bloodGroup && (
                      <div>
                        <span className="font-medium">Blood Group:</span>{" "}
                        {selectedPatient.patientProfile.bloodGroup}
                      </div>
                    )}
                    {selectedPatient.patientProfile?.emergencyContact && (
                      <div>
                        <span className="font-medium">Emergency Contact:</span>{" "}
                        {selectedPatient.patientProfile.emergencyContact}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Total Appointments:</span>{" "}
                      {selectedPatient._count.appointments}
                    </div>
                  </div>
                </div>
              </div>

              {selectedPatient.patientProfile?.address && (
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.patientProfile.address}
                  </p>
                </div>
              )}

              {selectedPatient.patientProfile?.allergies && (
                <div>
                  <h4 className="font-semibold mb-2">Allergies</h4>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(selectedPatient.patientProfile.allergies).map(
                      (allergy: string, index: number) => (
                        <Badge key={index} variant="destructive">
                          {allergy}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
