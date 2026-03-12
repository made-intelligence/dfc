"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Building2 } from "lucide-react";

interface PartnerData {
  id: string;
  name: string;
  shortName: string;
  type: string;
  primaryContact: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  rcNumber: string | null;
  logoUrl: string | null;
}

export default function SPLSettingsPage() {
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [primaryContact, setPrimaryContact] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/spl/settings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setPartner(data.partner);
      setPrimaryContact(data.partner.primaryContact || "");
      setPrimaryEmail(data.partner.primaryEmail || "");
      setPrimaryPhone(data.partner.primaryPhone || "");
    } catch (err) {
      setError("Failed to load settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/spl/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          primaryContact,
          primaryEmail,
          primaryPhone,
        }),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      const data = await response.json();
      setPartner(data.partner);
      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0A6E75" }} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || "Partner not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-serif" style={{ color: "#0D1F3C" }}>
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your partner contact details. Organization details are managed
          by the DFC Secretariat.
        </p>
      </div>

      {/* Success / Error messages */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Partner info card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Building2 className="h-5 w-5" style={{ color: "#0A6E75" }} />
          <h3 className="text-base font-semibold" style={{ color: "#0D1F3C" }}>
            Organization Details
          </h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Read-only fields */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Partner Name
            </label>
            <div
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
              style={{ color: "#0D1F3C" }}
            >
              {partner.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Short Name
              </label>
              <div
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                style={{ color: "#0D1F3C" }}
              >
                {partner.shortName}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Type
              </label>
              <div
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                style={{ color: "#0D1F3C" }}
              >
                {partner.type}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              RC Number
            </label>
            <div
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
              style={{ color: "#0D1F3C" }}
            >
              {partner.rcNumber || "Not provided"}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Editable fields */}
          <div>
            <label
              htmlFor="primaryContact"
              className="block text-sm font-medium mb-1"
              style={{ color: "#0D1F3C" }}
            >
              Primary Contact
            </label>
            <input
              id="primaryContact"
              type="text"
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={
                {
                  "--tw-ring-color": "#0A6E75",
                } as React.CSSProperties
              }
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 2px rgba(10,110,117,0.3)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
              placeholder="Full name of primary contact"
            />
          </div>

          <div>
            <label
              htmlFor="primaryEmail"
              className="block text-sm font-medium mb-1"
              style={{ color: "#0D1F3C" }}
            >
              Primary Email
            </label>
            <input
              id="primaryEmail"
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 2px rgba(10,110,117,0.3)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
              placeholder="contact@partner.com"
            />
          </div>

          <div>
            <label
              htmlFor="primaryPhone"
              className="block text-sm font-medium mb-1"
              style={{ color: "#0D1F3C" }}
            >
              Primary Phone
            </label>
            <input
              id="primaryPhone"
              type="tel"
              value={primaryPhone}
              onChange={(e) => setPrimaryPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 2px rgba(10,110,117,0.3)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
              placeholder="+234..."
            />
          </div>

          {/* Save button */}
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#0A6E75" }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
