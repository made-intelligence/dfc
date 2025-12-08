"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Heart, FileText, Edit, Save, X, Camera, Upload } from "lucide-react";
import { format } from "date-fns";
import Topbar from "@/components/layout/Topbar";
import { useToast } from "@/components/ui/toast";
import { Loading } from "@/components/ui/loading";

interface MedicalRecord {
  id: string;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  medications?: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  doctor: {
    user: {
      name: string;
    };
    specialty: {
      name: string;
    } | null;
  };
  appointment: {
    appointmentDate: string;
  };
}

interface PatientProfile {
  id: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  user: {
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  medicalRecords: MedicalRecord[];
  _count: {
    appointments: number;
    medicalRecords: number;
  };
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
    allergies: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (user && user.role !== "PATIENT") {
      router.push("/");
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/patient/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setProfileImage(data.user.profileImage || null);
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          dateOfBirth: data.dateOfBirth
            ? format(new Date(data.dateOfBirth), "yyyy-MM-dd")
            : "",
          gender: data.gender || "",
          address: data.address || "",
          emergencyContact: data.emergencyContact || "",
          bloodGroup: data.bloodGroup || "",
          allergies: data.allergies || "",
        });
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      setError("An error occurred while loading your profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
        addToast({
          title: "Success",
          description: "Your profile has been updated successfully",
          type: "success",
        });
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.user.name || "",
        phone: profile.user.phone || "",
        dateOfBirth: profile.dateOfBirth
          ? format(new Date(profile.dateOfBirth), "yyyy-MM-dd")
          : "",
        gender: profile.gender || "",
        address: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
        bloodGroup: profile.bloodGroup || "",
        allergies: profile.allergies || "",
      });
    }
    setIsEditing(false);
    setError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.url);
        
        // Update profile with new image
        const updateResponse = await fetch("/api/patient/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profileImage: data.url }),
        });

        if (updateResponse.ok) {
          fetchProfile();
          addToast({
            title: "Success",
            description: "Profile picture updated successfully",
            type: "success",
          });
        }
      } else {
        setError("Failed to upload image");
      }
    } catch (err) {
      setError("An error occurred while uploading the image");
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return <Loading type="pulse" size="lg" className="min-h-screen" />;
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Topbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your personal and medical information
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>
                Your basic personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center gap-4 pb-4 border-b">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {profileImage || profile.user.profileImage ? (
                      <img
                        src={profileImage || profile.user.profileImage || ""}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {profile.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Click the camera icon to upload a new photo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.user.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="mt-1 text-gray-900">{profile.user.email}</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {profile.user.phone || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {profile.dateOfBirth
                        ? format(new Date(profile.dateOfBirth), "MMM dd, yyyy")
                        : "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {profile.gender || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={2}
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {profile.address || "Not provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <CardTitle>Medical Information</CardTitle>
              </div>
              <CardDescription>
                Your medical details and emergency contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  {isEditing ? (
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) =>
                        setFormData({ ...formData, bloodGroup: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {profile.bloodGroup || "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {profile.emergencyContact || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                {isEditing ? (
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) =>
                      setFormData({ ...formData, allergies: e.target.value })
                    }
                    rows={2}
                    placeholder="List any allergies you have..."
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {profile.allergies || "No known allergies"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Medical Records</CardTitle>
              </div>
              <CardDescription>
                Your medical history and past consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.medicalRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No medical records yet
                </p>
              ) : (
                <div className="space-y-4">
                  {profile.medicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {record.diagnosis}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. {record.doctor.user.name}
                            {record.doctor.specialty && (
                              <span className="text-gray-400">
                                {" "}
                                • {record.doctor.specialty.name}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {format(
                            new Date(record.appointment.appointmentDate),
                            "MMM dd, yyyy"
                          )}
                        </Badge>
                      </div>
                      {record.symptoms && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Symptoms:
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.symptoms}
                          </p>
                        </div>
                      )}
                      {record.treatment && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Treatment:
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.treatment}
                          </p>
                        </div>
                      )}
                      {record.medications && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Medications:
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.medications}
                          </p>
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Notes:
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.notes}
                          </p>
                        </div>
                      )}
                      {record.followUpDate && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600">
                            Follow-up:{" "}
                            <span className="font-medium">
                              {format(
                                new Date(record.followUpDate),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Appointments</span>
                <span className="text-2xl font-bold text-primary">
                  {profile._count.appointments}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Medical Records</span>
                <span className="text-2xl font-bold text-primary">
                  {profile._count.medicalRecords}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/book")}
              >
                Book Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/appointments")}
              >
                View Appointments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}



