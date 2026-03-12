"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Verification {
  id: string;
  specialistName: string;
  specialty: string;
  licenseNumber: string | null;
  documentUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  UNVERIFIED: "bg-gray-100 text-gray-600",
};

const filterTabs = ["ALL", "PENDING", "VERIFIED", "REJECTED"];

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    specialistName: "",
    specialty: "",
    licenseNumber: "",
    documentUrl: "",
    notes: "",
  });

  useEffect(() => {
    fetchVerifications();
  }, [activeFilter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = activeFilter !== "ALL" ? `?status=${activeFilter}` : "";
      const response = await fetch(`/api/hospital/verification${params}`);
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/hospital/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setShowModal(false);
        setForm({
          specialistName: "",
          specialty: "",
          licenseNumber: "",
          documentUrl: "",
          notes: "",
        });
        fetchVerifications();
      }
    } catch (error) {
      console.error("Failed to create verification:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
            Verification
          </h2>
          <p className="text-gray-500 mt-1">
            Request and track specialist credential verifications
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-[#0A4A50] hover:bg-[#0A4A50]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Verification
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeFilter === tab
                ? "bg-white text-[#0D1F3C] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : verifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50">
                  <th className="px-6 py-3 font-medium">Specialist Name</th>
                  <th className="px-6 py-3 font-medium">Specialty</th>
                  <th className="px-6 py-3 font-medium">License #</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Submitted</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-[#0D1F3C]">
                      {v.specialistName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{v.specialty}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {v.licenseNumber || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[v.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {v.documentUrl ? (
                        <a
                          href={v.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A4A50] hover:underline text-sm font-medium"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No verification requests</p>
            <p className="mt-1">
              Submit a verification request to validate specialist credentials.
            </p>
          </div>
        )}
      </div>

      {/* Request Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-serif font-semibold text-[#0D1F3C]">
                Request Verification
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialist Name
                </label>
                <input
                  type="text"
                  required
                  value={form.specialistName}
                  onChange={(e) =>
                    setForm({ ...form, specialistName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  required
                  value={form.specialty}
                  onChange={(e) =>
                    setForm({ ...form, specialty: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number (optional)
                </label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) =>
                    setForm({ ...form, licenseNumber: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="e.g. MDCN/12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document URL (optional)
                </label>
                <input
                  type="url"
                  value={form.documentUrl}
                  onChange={(e) =>
                    setForm({ ...form, documentUrl: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent resize-none"
                  placeholder="Any additional context..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0A4A50] hover:bg-[#0A4A50]/90 text-white"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
