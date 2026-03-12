"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface HospitalData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  bedCount: number | null;
  specialties: string[] | null;
  tier: string;
  status: string;
}

export default function SettingsPage() {
  const [hospital, setHospital] = useState<HospitalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    description: "",
    bedCount: "",
    specialties: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/hospital/settings");
      if (response.ok) {
        const data = await response.json();
        const h = data.hospital;
        setHospital(h);
        setForm({
          email: h?.email || "",
          phone: h?.phone || "",
          website: h?.website || "",
          address: h?.address || "",
          city: h?.city || "",
          state: h?.state || "",
          description: h?.description || "",
          bedCount: h?.bedCount?.toString() || "",
          specialties: Array.isArray(h?.specialties)
            ? h.specialties.join(", ")
            : "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const payload = {
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        description: form.description || null,
        bedCount: form.bedCount ? parseInt(form.bedCount, 10) : null,
        specialties: form.specialties
          ? form.specialties.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
      };

      const response = await fetch("/api/hospital/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
            Settings
          </h2>
          <p className="text-gray-500 mt-1">Manage your hospital profile</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
          Settings
        </h2>
        <p className="text-gray-500 mt-1">Manage your hospital profile</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="font-serif font-semibold text-[#0D1F3C]">
              Hospital Profile
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Hospital Name (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                value={hospital?.name || ""}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">
                Contact the DFC Secretariat to update your hospital name.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
              />
            </div>

            {/* Phone & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="+234..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                placeholder="Street address"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent resize-none"
                placeholder="Brief description of your hospital..."
              />
            </div>

            {/* Bed Count & Specialties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bed Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.bedCount}
                  onChange={(e) =>
                    setForm({ ...form, bedCount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialties Offered
                </label>
                <input
                  type="text"
                  value={form.specialties}
                  onChange={(e) =>
                    setForm({ ...form, specialties: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="Cardiology, Neurology, Orthopaedics..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Comma-separated list
                </p>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex items-center justify-between">
            <div>
              {success && (
                <p className="text-sm text-green-600 font-medium">
                  Settings saved successfully.
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#0A4A50] hover:bg-[#0A4A50]/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
