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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  Save,
  Edit,
  Star,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";

interface DoctorProfile {
  id: string;
  specialty: {
    id: string;
    name: string;
  };
  license: string;
  experience: number;
  bio: string;
  consultationFee: number;
  currency: string;
  isAvailable: boolean;
  user: {
    name: string;
    email: string;
    phone: string;
    profileImage: string;
  };
  _count: {
    appointments: number;
    ratings: number;
  };
  avgRating: number;
}

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialtyId: "",
    experience: 0,
    bio: "",
    consultationFee: 0,
    isAvailable: true,
  });

  useEffect(() => {
    fetchProfile();
    fetchSpecialties();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/doctor/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.user.name,
          phone: data.user.phone || "",
          specialtyId: data.specialty?.id || "",
          experience: data.experience,
          bio: data.bio || "",
          consultationFee: data.consultationFee,
          isAvailable: data.isAvailable,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await fetch("/api/public/specialties");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.specialties);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };
  console.log(profile);

  const handleSave = async () => {
    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchProfile();
        setEditing(false);
        addToast({
          title: "Success",
          description: "Your profile has been updated successfully",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.user.name,
        phone: profile.user.phone || "",
        specialtyId: profile.specialty?.id || "",
        experience: profile.experience,
        bio: profile.bio || "",
        consultationFee: profile.consultationFee,
        isAvailable: profile.isAvailable,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return <Loading type="skeleton" size="lg" />;
  }

  if (!profile) {
    return (
      <div className="text-center text-red-500">Error loading profile</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Doctor Profile</h1>
          <p className="text-gray-600">
            Manage your professional profile and information
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
             {profile.user.profileImage ? (
                <Image
                  src={profile.user.profileImage}
                  alt={profile.user.name}
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              ) : ( <User className="h-12 w-12 text-blue-600" />)}
            </div>
            <CardTitle>{profile.user.name}</CardTitle>
            <CardDescription>{profile.specialty?.name || "No specialty assigned"}</CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={profile.isAvailable ? "default" : "secondary"}>
                {profile.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{profile.user.email}</span>
            </div>
            {profile.user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{profile.user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-gray-500" />
              <span>{profile.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>
                {profile.avgRating.toFixed(1)} ({profile._count.ratings}{" "}
                reviews)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Your medical practice details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                {editing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.user.name}
                  </div>
                )}
              </div>
              <div>
                <Label>Phone Number</Label>
                {editing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.user.phone || "Not provided"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Specialty</Label>
                {editing ? (
                  <Select
                    value={formData.specialtyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, specialtyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.specialty?.name || "No specialty assigned"}
                  </div>
                )}
              </div>
              <div>
                <Label>Years of Experience</Label>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experience: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded-md">
                    {profile.experience} years
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Medical License</Label>
              <div className="p-2 bg-gray-50 rounded-md">{profile.license}</div>
              <p className="text-xs text-gray-500 mt-1">
                Contact support to update your license number
              </p>
            </div>

            <div>
              <Label>Consultation Fee (₦)</Label>
              {editing ? (
                <Input
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consultationFee: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">
                  ₦{Number(profile.consultationFee).toLocaleString()}
                </div>
              )}
            </div>

            <div>
              <Label>Professional Bio</Label>
              {editing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell patients about your background, expertise, and approach to healthcare..."
                  rows={4}
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded-md min-h-[100px]">
                  {profile.bio || "No bio provided"}
                </div>
              )}
            </div>

            {editing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                />
                <Label htmlFor="isAvailable">Available for appointments</Label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {profile._count.appointments}
            </div>
            <div className="text-sm text-gray-600">Total Appointments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {profile._count.ratings}
            </div>
            <div className="text-sm text-gray-600">Patient Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {profile.avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
