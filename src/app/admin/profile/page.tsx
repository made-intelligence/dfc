"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/admin/user-permissions?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setPermissions(data.permissions || []))
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const profileDirty = name.trim() !== user.name || phone.trim() !== (user.phone ?? "");

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile");
      await refreshUser();
      addToast({ type: "success", title: "Profile updated" });
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account details and sign-in password</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
                <p className="text-xs text-gray-500">Ask another admin to change your sign-in email.</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex h-10 items-center gap-2">
                  <Badge variant={user.role === "SUPERADMIN" ? "default" : "secondary"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                  {user.createdAt && (
                    <span className="text-xs text-gray-500">
                      Since {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile || !profileDirty || !name.trim()}>
                {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.role === "SUPERADMIN" ? (
            <p className="text-sm text-gray-600">Super admins have every permission.</p>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-gray-600">No extra permissions assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((p) => (
                <Badge key={p} variant="secondary">{p}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
