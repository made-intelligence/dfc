"use client";

import { useState, useEffect } from "react";
import { Download, Receipt, Loader2 } from "lucide-react";

interface SPLInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  caseCount: number;
  subtotal: string;
  dfcFee: string;
  total: string;
  status: string;
  dueDate: string;
  pdfUrl: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    case "SENT":
      return "bg-blue-100 text-blue-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("NGN", "\u20A6");
}

export default function SPLInvoicesPage() {
  const [invoices, setInvoices] = useState<SPLInvoice[]>([]);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/spl/invoices", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data.invoices);
      setOutstandingTotal(data.outstandingTotal);
    } catch (err) {
      setError("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          Invoices
        </h1>
        <p className="text-gray-500 mt-1">
          View and download invoices for services rendered.
        </p>
      </div>

      {/* Outstanding balance summary */}
      <div
        className="rounded-xl border p-5 flex items-center justify-between"
        style={{
          borderColor: outstandingTotal > 0 ? "#ef4444" : "#e5e7eb",
          backgroundColor: outstandingTotal > 0 ? "rgba(239,68,68,0.04)" : "#fff",
        }}
      >
        <div>
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: outstandingTotal > 0 ? "#dc2626" : "#0D1F3C" }}
          >
            {formatCurrency(outstandingTotal)}
          </p>
        </div>
        {outstandingTotal > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Payment Required
          </span>
        )}
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold" style={{ color: "#0D1F3C" }}>
            All Invoices
          </h3>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Invoice #
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Period
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Cases
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td
                      className="px-6 py-4 font-medium"
                      style={{ color: "#0D1F3C" }}
                    >
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(invoice.periodStart).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      &ndash;{" "}
                      {new Date(invoice.periodEnd).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {invoice.caseCount}
                    </td>
                    <td
                      className="px-6 py-4 font-medium"
                      style={{ color: "#0D1F3C" }}
                    >
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInvoiceStatusBadge(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                          style={{ color: "#0A6E75" }}
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
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
