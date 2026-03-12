"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Stethoscope,
  ClipboardCheck,
} from "lucide-react";

const SPECIALTIES = [
  "Cardiology",
  "Oncology",
  "Neurology",
  "Orthopaedics",
  "Gastroenterology",
  "Urology",
  "Ophthalmology",
  "ENT",
  "Dermatology",
  "Paediatrics",
  "Obstetrics & Gynaecology",
  "General Surgery",
  "Psychiatry",
];

const SERVICE_TYPES = [
  { value: "SECOND_OPINION", label: "Second Opinion" },
  { value: "SPECIALIST_CONSULTATION", label: "Specialist Consultation" },
  { value: "SURGICAL_REVIEW", label: "Surgical Review" },
];

interface FormData {
  membershipNumber: string;
  patientName: string;
  patientDob: string;
  patientEmail: string;
  patientPhone: string;
  serviceType: string;
  specialty: string;
  diagnosis: string;
  clinicalSummary: string;
  specificQuestions: string;
}

const STEPS = [
  { number: 1, label: "Patient Reference", icon: User },
  { number: 2, label: "Clinical Details", icon: Stethoscope },
  { number: 3, label: "Review & Confirm", icon: ClipboardCheck },
];

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    membershipNumber: "",
    patientName: "",
    patientDob: "",
    patientEmail: "",
    patientPhone: "",
    serviceType: "",
    specialty: "",
    diagnosis: "",
    clinicalSummary: "",
    specificQuestions: "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.membershipNumber.trim()) {
      addToast({ title: "Validation", description: "HMO membership number is required", type: "error" });
      return false;
    }
    if (!formData.patientName.trim()) {
      addToast({ title: "Validation", description: "Patient name is required", type: "error" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.serviceType) {
      addToast({ title: "Validation", description: "Service type is required", type: "error" });
      return false;
    }
    if (!formData.specialty) {
      addToast({ title: "Validation", description: "Specialty is required", type: "error" });
      return false;
    }
    if (!formData.diagnosis.trim()) {
      addToast({ title: "Validation", description: "Diagnosis / working diagnosis is required", type: "error" });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/spl/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast({ title: "Error", description: data.error || "Failed to submit case", type: "error" });
        return;
      }

      addToast({
        title: "Case Submitted",
        description: `Case ${data.referenceNumber} has been submitted successfully.`,
        type: "success",
      });
      router.push(`/spl/cases/${data.caseId}`);
    } catch (error) {
      console.error("Error submitting case:", error);
      addToast({ title: "Error", description: "An unexpected error occurred", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getServiceTypeLabel = (value: string) =>
    SERVICE_TYPES.find((s) => s.value === value)?.label || value;

  if (!user) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/spl/cases")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0D1F3C] mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Cases
          </button>
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Submit New Case</h1>
          <p className="text-gray-500 mt-1">
            Complete the form below to submit a patient case for specialist review.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-[#0A6E75] text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium text-center ${
                        isActive
                          ? "text-[#0A6E75]"
                          : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 mt-[-1.5rem] ${
                        currentStep > step.number
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-lg text-[#0D1F3C]">
              {STEPS[currentStep - 1].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step 1: Patient Reference */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="membershipNumber" className="text-sm font-medium text-[#0D1F3C]">
                    HMO Membership Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="membershipNumber"
                    placeholder="e.g. HMO-2024-001234"
                    value={formData.membershipNumber}
                    onChange={(e) => updateField("membershipNumber", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="patientName" className="text-sm font-medium text-[#0D1F3C]">
                    Patient Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    placeholder="Full name"
                    value={formData.patientName}
                    onChange={(e) => updateField("patientName", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="patientDob" className="text-sm font-medium text-[#0D1F3C]">
                    Date of Birth
                  </Label>
                  <Input
                    id="patientDob"
                    type="date"
                    value={formData.patientDob}
                    onChange={(e) => updateField("patientDob", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientEmail" className="text-sm font-medium text-[#0D1F3C]">
                      Contact Email
                    </Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.patientEmail}
                      onChange={(e) => updateField("patientEmail", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientPhone" className="text-sm font-medium text-[#0D1F3C]">
                      Contact Phone
                    </Label>
                    <Input
                      id="patientPhone"
                      type="tel"
                      placeholder="+234..."
                      value={formData.patientPhone}
                      onChange={(e) => updateField("patientPhone", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Clinical Details */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <Label htmlFor="serviceType" className="text-sm font-medium text-[#0D1F3C]">
                    Service Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="serviceType"
                    value={formData.serviceType}
                    onChange={(e) => updateField("serviceType", e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent"
                  >
                    <option value="">Select service type...</option>
                    {SERVICE_TYPES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="specialty" className="text-sm font-medium text-[#0D1F3C]">
                    Specialty <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => updateField("specialty", e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent"
                  >
                    <option value="">Select specialty...</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="diagnosis" className="text-sm font-medium text-[#0D1F3C]">
                    Diagnosis / Working Diagnosis <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="diagnosis"
                    rows={3}
                    placeholder="Enter the current diagnosis or working diagnosis..."
                    value={formData.diagnosis}
                    onChange={(e) => updateField("diagnosis", e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="clinicalSummary" className="text-sm font-medium text-[#0D1F3C]">
                    Clinical Summary
                  </Label>
                  <textarea
                    id="clinicalSummary"
                    rows={4}
                    placeholder="Provide relevant clinical history, investigations, and current management..."
                    value={formData.clinicalSummary}
                    onChange={(e) => updateField("clinicalSummary", e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="specificQuestions" className="text-sm font-medium text-[#0D1F3C]">
                    Specific Questions
                  </Label>
                  <textarea
                    id="specificQuestions"
                    rows={3}
                    placeholder="Any specific questions you would like the specialist to address..."
                    value={formData.specificQuestions}
                    onChange={(e) => updateField("specificQuestions", e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Patient Reference Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-[#0D1F3C] uppercase tracking-wide mb-3">
                    Patient Reference
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <SummaryRow label="HMO Membership No." value={formData.membershipNumber} />
                    <SummaryRow label="Patient Name" value={formData.patientName} />
                    {formData.patientDob && (
                      <SummaryRow label="Date of Birth" value={formData.patientDob} />
                    )}
                    {formData.patientEmail && (
                      <SummaryRow label="Email" value={formData.patientEmail} />
                    )}
                    {formData.patientPhone && (
                      <SummaryRow label="Phone" value={formData.patientPhone} />
                    )}
                  </div>
                </div>

                {/* Clinical Details Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-[#0D1F3C] uppercase tracking-wide mb-3">
                    Clinical Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <SummaryRow label="Service Type" value={getServiceTypeLabel(formData.serviceType)} />
                    <SummaryRow label="Specialty" value={formData.specialty} />
                    <SummaryRow label="Diagnosis" value={formData.diagnosis} />
                    {formData.clinicalSummary && (
                      <SummaryRow label="Clinical Summary" value={formData.clinicalSummary} />
                    )}
                    {formData.specificQuestions && (
                      <SummaryRow label="Specific Questions" value={formData.specificQuestions} />
                    )}
                  </div>
                </div>

                {/* Fee Notice */}
                <div className="bg-[#0A6E75]/5 border border-[#0A6E75]/20 rounded-lg p-4">
                  <p className="text-sm text-[#0A6E75] font-medium">
                    Fee will be calculated from your contract terms
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    The agreed fee for this case will be determined based on the service type and your active contract schedule.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#0A6E75] hover:bg-[#0A6E75]/90 text-white flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 text-white px-6"
                >
                  {submitting ? "Submitting..." : "Submit Case to SPL"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
      <span className="text-xs font-medium text-gray-500 sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-sm text-[#0D1F3C] whitespace-pre-wrap">{value}</span>
    </div>
  );
}
