"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface SPLContract {
  id: string;
  title: string;
  model: "FEE_FOR_SERVICE" | "SUBSCRIPTION" | "HYBRID";
  status: string;
  startDate: string;
  endDate: string;
  subscribedVolume: number | null;
  casesDeliveredThisPeriod: number;
  casesRemainingThisPeriod: number | null;
  contractUrl: string | null;
  description: string | null;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800";
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    case "TERMINATED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getModelBadgeClasses(model: string) {
  switch (model) {
    case "SUBSCRIPTION":
      return "bg-blue-100 text-blue-800";
    case "FEE_FOR_SERVICE":
      return "bg-purple-100 text-purple-800";
    case "HYBRID":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatModelLabel(model: string) {
  return model.replace(/_/g, " ");
}

export default function SPLContractsPage() {
  const [contracts, setContracts] = useState<SPLContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch("/api/spl/contracts", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const data = await response.json();
      setContracts(data.contracts);
    } catch (err) {
      setError("Failed to load contracts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeContract = contracts.find((c) => c.status === "ACTIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#0A6E75" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-serif" style={{ color: "#0D1F3C" }}>
          Contracts
        </h1>
        <p className="text-gray-500 mt-1">
          View your service contracts with DFC. Contracts are managed by the DFC
          Secretariat.
        </p>
      </div>

      {/* Active contract highlight */}
      {activeContract && (
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "#0A6E75",
            backgroundColor: "rgba(10,110,117,0.04)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2
                  className="text-lg font-semibold font-serif"
                  style={{ color: "#0D1F3C" }}
                >
                  {activeContract.title}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModelBadgeClasses(activeContract.model)}`}
                >
                  {formatModelLabel(activeContract.model)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(activeContract.status)}`}
                >
                  {activeContract.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Runs until:{" "}
                <span className="font-medium" style={{ color: "#0D1F3C" }}>
                  {new Date(activeContract.endDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>

              {/* Volume info based on model */}
              {(activeContract.model === "SUBSCRIPTION" ||
                activeContract.model === "HYBRID") &&
                activeContract.subscribedVolume !== null && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Cases used this period:{" "}
                      <span className="font-semibold" style={{ color: "#0D1F3C" }}>
                        {activeContract.casesDeliveredThisPeriod}
                      </span>{" "}
                      / {activeContract.subscribedVolume}
                    </p>
                    <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          backgroundColor: "#0A6E75",
                          width: `${Math.min(
                            100,
                            (activeContract.casesDeliveredThisPeriod /
                              activeContract.subscribedVolume) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              {activeContract.model === "FEE_FOR_SERVICE" && (
                <p className="text-sm text-gray-600">
                  Cases delivered this month:{" "}
                  <span className="font-semibold" style={{ color: "#0D1F3C" }}>
                    {activeContract.casesDeliveredThisPeriod}
                  </span>
                </p>
              )}
            </div>

            {/* Download button */}
            {activeContract.contractUrl && (
              <a
                href={activeContract.contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#0A6E75" }}
              >
                <Download className="h-4 w-4" />
                Download Contract
              </a>
            )}
          </div>
        </div>
      )}

      {/* Contracts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold" style={{ color: "#0D1F3C" }}>
            All Contracts
          </h3>
        </div>
        {contracts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No contracts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Model
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Start Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    End Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium" style={{ color: "#0D1F3C" }}>
                      {contract.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getModelBadgeClasses(contract.model)}`}
                      >
                        {formatModelLabel(contract.model)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClasses(contract.status)}`}
                      >
                        {contract.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(contract.startDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(contract.endDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {contract.subscribedVolume !== null
                        ? `${contract.casesDeliveredThisPeriod} / ${contract.subscribedVolume}`
                        : contract.casesDeliveredThisPeriod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
