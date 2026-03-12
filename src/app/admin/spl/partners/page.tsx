"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Building, Plus, ArrowLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SPLPartner {
  id: string;
  name: string;
  shortName: string;
  type: string;
  status: string;
  primaryContact: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  rcNumber: string | null;
  createdAt: string;
  _count: {
    contracts: number;
    cases: number;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-700",
  TERMINATED: "bg-red-200 text-red-900",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SPLPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<SPLPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch("/api/admin/spl/partners", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners);
        }
      } catch {
        console.error("Failed to fetch partners");
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  return (
    <DashboardLayout title="SPL Partners">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/admin/spl")}
              className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to SPL
            </button>
            <h1
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "#0D1F3C" }}
            >
              Partners
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage HMO, corporate, and government partners.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/spl/partners/new")}
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0A6E75" }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Partner
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Loading partners...
            </span>
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <Building className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No partners found. Create your first partner to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Name", "Short Name", "Type", "Status", "Contracts", "Cases", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {partners.map((p) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {p.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {p.shortName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {p.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {p.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {p._count.contracts}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {p._count.cases}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          onClick={() =>
                            router.push(`/admin/spl/partners/${p.id}`)
                          }
                          className="text-xs font-medium text-[#0A6E75] hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {partners.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/admin/spl/partners/${p.id}`)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {p.shortName} | {p.type}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>{p._count.contracts} contracts</span>
                    <span>{p._count.cases} cases</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
