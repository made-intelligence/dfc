"use client";

import { FileText, Shield, Building2, ClipboardCheck } from "lucide-react";

const documentTypes = [
  {
    title: "Partnership Agreement",
    description: "Your signed partnership agreement with DFC",
    icon: FileText,
    status: "Pending",
  },
  {
    title: "Insurance Certificate",
    description: "Professional indemnity and liability coverage",
    icon: Shield,
    status: "Pending",
  },
  {
    title: "Facility License",
    description: "Current facility operating license and accreditation",
    icon: Building2,
    status: "Pending",
  },
  {
    title: "Compliance Documents",
    description: "Regulatory compliance and quality assurance documentation",
    icon: ClipboardCheck,
    status: "Pending",
  },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#0D1F3C]">
          Documents
        </h2>
        <p className="text-gray-500 mt-1">
          Partnership documents and agreements
        </p>
      </div>

      {/* Notice banner */}
      <div className="bg-[#0A4A50]/5 border border-[#0A4A50]/20 rounded-xl p-6">
        <p className="text-[#0D1F3C] font-medium">
          Documents and agreements will appear here once your partnership is
          finalised.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          The DFC Secretariat will upload relevant documents as your partnership
          progresses. You will be notified when new documents are available.
        </p>
      </div>

      {/* Document type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documentTypes.map((doc) => (
          <div
            key={doc.title}
            className="bg-white rounded-xl shadow-sm border p-6 flex items-start space-x-4"
          >
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <doc.icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#0D1F3C]">{doc.title}</h3>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  {doc.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
