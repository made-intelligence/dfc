"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Loader2, Upload, X } from "lucide-react";

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Specialty {
  id: string;
  name: string;
}

export default function AddDoctorModal({ isOpen, onClose, onSuccess }: AddDoctorModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    license: "",
    experience: "",
    bio: "",
    consultationFee: "",
    specialtyId: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        addToast({ type: "error", title: "File Too Large", description: "Image must be less than 5MB" });
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        return result.url;
      } else {
        addToast({ type: "error", title: "Upload Failed", description: "Failed to upload image" });
        return null;
      }
    } catch (error) {
      addToast({ type: "error", title: "Upload Error", description: "Error uploading image" });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImageUrl = "";
      
      if (selectedFile) {
        setImageUploading(true);
        const uploadResult = await uploadImage(selectedFile);
        setImageUploading(false);
        
        if (uploadResult === null) {
          return;
        }
        uploadedImageUrl = uploadResult;
      }

      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profileImage: uploadedImageUrl,
          experience: parseInt(formData.experience),
          consultationFee: parseFloat(formData.consultationFee),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          license: "",
          experience: "",
          bio: "",
          consultationFee: "",
          specialtyId: "",
        });
        setProfileImage("");
        setSelectedFile(null);
      } else {
        const error = await response.json();
        addToast({ type: "error", title: "Creation Failed", description: error.error || "Failed to create member" });
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", description: "Error creating member" });
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await fetch("/api/public/specialties");
      const data = await response.json();
      setSpecialties(data.specialties || []);
    } catch (error) {
      console.error("Failed to fetch specialties:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSpecialties();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              {profileImage && (
                <div className="relative">
                  <Image src={profileImage} alt="Profile" width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage("");
                      setSelectedFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
              >
                {imageUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.license}
                onChange={(e) => handleInputChange("license", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                value={formData.experience}
                onChange={(e) => handleInputChange("experience", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={formData.specialtyId} onValueChange={(value) => handleInputChange("specialtyId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="consultationFee">Consultation Fee (₦)</Label>
              <Input
                id="consultationFee"
                type="number"
                step="0.01"
                value={formData.consultationFee}
                onChange={(e) => handleInputChange("consultationFee", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Doctor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}