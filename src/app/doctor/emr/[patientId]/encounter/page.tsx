"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Check,
  Calendar,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import CDSSPanel from "@/components/emr/CDSSPanel";
import AllergyBanner from "@/components/emr/AllergyBanner";
import ICD10Picker from "@/components/emr/ICD10Picker";
import FormularyPicker from "@/components/emr/FormularyPicker";
import InvestigationPicker from "@/components/emr/InvestigationPicker";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PrescriptionItem {
  id: string;
  drugName: string;
  dose: string;
  form: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

interface InvestigationItem {
  id: string;
  type: string;
  name: string;
  urgency: string;
  instructions: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

let toastId = 0;

// ─── Toast Component ────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium ${
            t.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {t.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

function EncounterContent() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transcript = searchParams.get("transcript") || "";

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);
  const [encounterId, setEncounterId] = useState<string | null>(null);

  // Header fields
  const [encounterType, setEncounterType] = useState("CONSULTATION");
  const [encounterDate, setEncounterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [location, setLocation] = useState("");

  // SOAP fields
  const [subjective, setSubjective] = useState(transcript);
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  // Objective — inline vitals
  const [systolicBP, setSystolicBP] = useState("");
  const [diastolicBP, setDiastolicBP] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSat, setOxygenSat] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Assessment
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [icd10Code, setIcd10Code] = useState("");
  const [clinicalReasoning, setClinicalReasoning] = useState("");
  const [addToProblemList, setAddToProblemList] = useState(false);

  // Plan inline forms
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showInvestigationForm, setShowInvestigationForm] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");

  // Prescriptions
  const [prescriptionItems, setPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);

  // Investigations
  const [investigationItems, setInvestigationItems] = useState<
    InvestigationItem[]
  >([]);

  // Sign confirmation
  const [showSignConfirm, setShowSignConfirm] = useState(false);

  // CDSS integration
  const [lastDrugAdded, setLastDrugAdded] = useState<string | undefined>();
  const [patientAllergies, setPatientAllergies] = useState<{ allergen: string; severity: string }[]>([]);

  useEffect(() => {
    fetch(`/api/emr/allergies?patientId=${patientId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { allergies: [] })
      .then((d) => setPatientAllergies(d.allergies ?? []))
      .catch(() => {});
  }, [patientId]);

  const bmi =
    weight && height
      ? (
          parseFloat(weight) /
          (parseFloat(height) / 100) ** 2
        ).toFixed(1)
      : null;

  const addToast = useCallback(
    (type: "success" | "error", message: string) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Save / Sign ────────────────────────────────────────────

  async function saveEncounter(status: "DRAFT" | "SIGNED") {
    if (!chiefComplaint.trim()) {
      addToast("error", "Chief complaint is required");
      return;
    }

    setSaving(true);

    try {
      // Build objective text combining vitals + examination findings
      let objectiveText = objective;
      const vitalsParts: string[] = [];
      if (systolicBP && diastolicBP)
        vitalsParts.push(`BP: ${systolicBP}/${diastolicBP} mmHg`);
      if (heartRate) vitalsParts.push(`HR: ${heartRate} bpm`);
      if (temperature) vitalsParts.push(`Temp: ${temperature} C`);
      if (oxygenSat) vitalsParts.push(`SpO2: ${oxygenSat}%`);
      if (weight) vitalsParts.push(`Weight: ${weight} kg`);
      if (height) vitalsParts.push(`Height: ${height} cm`);
      if (bmi && !isNaN(parseFloat(bmi)))
        vitalsParts.push(`BMI: ${bmi}`);
      if (vitalsParts.length > 0) {
        const vitalsLine = `Vitals: ${vitalsParts.join(" | ")}`;
        objectiveText = objectiveText
          ? `${vitalsLine}\n\n${objectiveText}`
          : vitalsLine;
      }

      // Build assessment combining diagnosis + reasoning
      let assessmentText = assessment;
      if (primaryDiagnosis && !assessmentText.includes(primaryDiagnosis)) {
        const diagLine = `Dx: ${primaryDiagnosis}${icd10Code ? ` (${icd10Code})` : ""}`;
        assessmentText = assessmentText
          ? `${diagLine}\n\n${assessmentText}`
          : diagLine;
      }
      if (clinicalReasoning && !assessmentText.includes(clinicalReasoning)) {
        assessmentText = assessmentText
          ? `${assessmentText}\n\n${clinicalReasoning}`
          : clinicalReasoning;
      }

      // Create or update encounter
      let currentEncounterId = encounterId;

      if (!currentEncounterId) {
        // Create new encounter
        const res = await fetch("/api/emr/encounters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            encounterType,
            encounterDate: new Date(encounterDate).toISOString(),
            location: location.trim() || undefined,
            chiefComplaint: chiefComplaint.trim(),
            subjective: subjective.trim() || undefined,
            objective: objectiveText.trim() || undefined,
            assessment: assessmentText.trim() || undefined,
            plan: plan.trim() || undefined,
            primaryDiagnosis: primaryDiagnosis.trim() || undefined,
            isConfidential: false,
            followUpDate: followUpDate
              ? new Date(followUpDate).toISOString()
              : undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create encounter");
        }

        const encounter = await res.json();
        currentEncounterId = encounter.id;
        setEncounterId(encounter.id);
      } else {
        // Update existing encounter
        const res = await fetch(`/api/emr/encounters/${currentEncounterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            encounterType,
            encounterDate: new Date(encounterDate).toISOString(),
            location: location.trim() || undefined,
            chiefComplaint: chiefComplaint.trim(),
            subjective: subjective.trim() || undefined,
            objective: objectiveText.trim() || undefined,
            assessment: assessmentText.trim() || undefined,
            plan: plan.trim() || undefined,
            primaryDiagnosis: primaryDiagnosis.trim() || undefined,
            followUpDate: followUpDate
              ? new Date(followUpDate).toISOString()
              : null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update encounter");
        }
      }

      // Save vitals if any provided
      const hasVitals =
        systolicBP ||
        diastolicBP ||
        heartRate ||
        temperature ||
        oxygenSat ||
        weight ||
        height;
      if (hasVitals && currentEncounterId) {
        await fetch("/api/emr/vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            encounterId: currentEncounterId,
            systolicBP: systolicBP || undefined,
            diastolicBP: diastolicBP || undefined,
            heartRate: heartRate || undefined,
            temperature: temperature || undefined,
            oxygenSat: oxygenSat || undefined,
            weight: weight || undefined,
            height: height || undefined,
          }),
        }).catch(() => {});
      }

      // Save prescriptions
      if (prescriptionItems.length > 0 && currentEncounterId) {
        await fetch("/api/emr/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            encounterId: currentEncounterId,
            patientId,
            items: prescriptionItems.map((item) => ({
              drugName: item.drugName,
              dose: item.dose,
              form: item.form || undefined,
              route: item.route || undefined,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.quantity || undefined,
              instructions: item.instructions || undefined,
            })),
          }),
        }).catch(() => {});
      }

      // Save investigations
      if (investigationItems.length > 0 && currentEncounterId) {
        await Promise.all(
          investigationItems.map((inv) =>
            fetch("/api/emr/investigations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                encounterId: currentEncounterId,
                patientId,
                type: inv.type,
                name: inv.name,
                urgency: inv.urgency,
                instructions: inv.instructions || undefined,
              }),
            }).catch(() => {}),
          ),
        );
      }

      // Add to problem list if checked
      if (addToProblemList && primaryDiagnosis.trim()) {
        await fetch("/api/emr/problems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            patientId,
            problem: primaryDiagnosis.trim(),
            icdCode: icd10Code.trim() || undefined,
          }),
        }).catch(() => {});
      }

      // Sign if requested
      if (status === "SIGNED" && currentEncounterId) {
        const signRes = await fetch(
          `/api/emr/encounters/${currentEncounterId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: "SIGNED" }),
          },
        );
        if (!signRes.ok) {
          const data = await signRes.json();
          throw new Error(data.error || "Failed to sign encounter");
        }
      }

      addToast(
        "success",
        status === "SIGNED"
          ? "Encounter signed and saved"
          : "Draft saved successfully",
      );

      // Navigate back
      setTimeout(() => {
        router.push(`/doctor/emr/${patientId}`);
      }, 1000);
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Failed to save encounter",
      );
    } finally {
      setSaving(false);
    }
  }

  // ─── Prescription Item Management ──────────────────────────

  function addPrescriptionItem() {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        id: generateTempId(),
        drugName: "",
        dose: "",
        form: "Tablet",
        route: "Oral",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
      },
    ]);
  }

  function updatePrescriptionItem(
    id: string,
    field: keyof PrescriptionItem,
    value: string,
  ) {
    setPrescriptionItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    // Trigger CDSS drug check when drugName is set with ≥3 chars
    if (field === "drugName" && value.length >= 3) {
      setLastDrugAdded(value);
    }
  }

  function removePrescriptionItem(id: string) {
    setPrescriptionItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ─── Investigation Item Management ─────────────────────────

  function addInvestigationItem() {
    setInvestigationItems((prev) => [
      ...prev,
      {
        id: generateTempId(),
        type: "LAB",
        name: "",
        urgency: "ROUTINE",
        instructions: "",
      },
    ]);
  }

  function updateInvestigationItem(
    id: string,
    field: keyof InvestigationItem,
    value: string,
  ) {
    setInvestigationItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeInvestigationItem(id: string) {
    setInvestigationItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="pb-24">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push(`/doctor/emr/${patientId}`)}
          className="flex items-center gap-2 text-[#0A6E75] font-medium hover:underline text-base mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patient record
        </button>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">New Encounter</h1>
      </div>

      {/* Allergy Banner */}
      <div className="mb-4">
        <AllergyBanner allergies={patientAllergies} />
      </div>

      {/* Main grid: encounter form + CDSS panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6">

      {/* Encounter Header */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encounter Type
            </label>
            <select
              value={encounterType}
              onChange={(e) => setEncounterType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
            >
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-Up</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={encounterDate}
              onChange={(e) => setEncounterDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Clinic Room 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Primary reason for visit"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
            />
          </div>
        </div>
      </div>

      {/* SOAP Note */}
      <div className="space-y-6">
        {/* SUBJECTIVE */}
        <div className="rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#0D1F3C] mb-3">Subjective</h2>
          <textarea
            placeholder="Patient's history, symptoms, and narrative..."
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] resize-y"
          />
        </div>

        {/* OBJECTIVE */}
        <div className="rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#0D1F3C] mb-3">Objective</h2>

          {/* Inline vitals */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Vitals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Systolic BP
                </label>
                <input
                  type="number"
                  placeholder="mmHg"
                  value={systolicBP}
                  onChange={(e) => setSystolicBP(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Diastolic BP
                </label>
                <input
                  type="number"
                  placeholder="mmHg"
                  value={diastolicBP}
                  onChange={(e) => setDiastolicBP(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Heart Rate
                </label>
                <input
                  type="number"
                  placeholder="bpm"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Temp
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="C"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  SpO2
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="%"
                  value={oxygenSat}
                  onChange={(e) => setOxygenSat(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
              </div>
              {bmi && !isNaN(parseFloat(bmi)) && (
                <div className="flex items-end">
                  <div className="w-full rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    BMI: <span className="font-semibold">{bmi}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Examination Findings
          </h3>
          <textarea
            placeholder="Physical examination findings..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] resize-y"
          />
        </div>

        {/* ASSESSMENT */}
        <div className="rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#0D1F3C] mb-3">Assessment</h2>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <ICD10Picker
                value={primaryDiagnosis}
                codeValue={icd10Code}
                onSelect={(name, code) => {
                  setPrimaryDiagnosis(name);
                  setIcd10Code(code);
                }}
                placeholder="Search diagnoses (ICD-10)..."
                label="Primary Diagnosis"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICD-10 Code
                </label>
                <input
                  type="text"
                  placeholder="Auto-filled or type manually"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] font-mono"
                />
              </div>
            </div>
            <textarea
              placeholder="Clinical reasoning..."
              value={clinicalReasoning}
              onChange={(e) => setClinicalReasoning(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] resize-y"
            />
            <textarea
              placeholder="Additional assessment notes..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] resize-y"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={addToProblemList}
                onChange={(e) => setAddToProblemList(e.target.checked)}
                className="rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
              />
              Add to patient&apos;s problem list
            </label>
          </div>
        </div>

        {/* PLAN */}
        <div className="rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-[#0D1F3C] mb-3">Plan</h2>
          <textarea
            placeholder="Treatment plan..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A6E75] resize-y mb-3"
          />

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setShowPrescriptionForm(true);
                if (prescriptionItems.length === 0) addPrescriptionItem();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6E75] text-[#0A6E75] px-3 py-2 text-sm font-medium hover:bg-[#0A6E75]/5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add prescription
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInvestigationForm(true);
                if (investigationItems.length === 0) addInvestigationItem();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6E75] text-[#0A6E75] px-3 py-2 text-sm font-medium hover:bg-[#0A6E75]/5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Order investigation
            </button>
            <button
              type="button"
              onClick={() => setShowFollowUpPicker(!showFollowUpPicker)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A6E75] text-[#0A6E75] px-3 py-2 text-sm font-medium hover:bg-[#0A6E75]/5 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Set follow-up
            </button>
          </div>

          {/* Follow-up date picker */}
          {showFollowUpPicker && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Follow-up date:
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                />
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpDate("");
                      setShowFollowUpPicker(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prescription form */}
          {showPrescriptionForm && (
            <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#0D1F3C]">Prescription</h3>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {prescriptionItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-lg border border-gray-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Item {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(item.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormularyPicker
                      currentValue={item.drugName}
                      onSelect={(drug) => {
                        updatePrescriptionItem(item.id, "drugName", drug.drugName);
                        if (drug.dose) updatePrescriptionItem(item.id, "dose", drug.dose);
                        if (drug.form) updatePrescriptionItem(item.id, "form", drug.form);
                        if (drug.route) updatePrescriptionItem(item.id, "route", drug.route);
                        if (drug.frequency) updatePrescriptionItem(item.id, "frequency", drug.frequency);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Dose *"
                      value={item.dose}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "dose",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                    <select
                      value={item.form}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "form",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Suppository">Suppository</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={item.route}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "route",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    >
                      <option value="Oral">Oral</option>
                      <option value="IV">IV</option>
                      <option value="IM">IM</option>
                      <option value="SC">SC</option>
                      <option value="Topical">Topical</option>
                      <option value="Rectal">Rectal</option>
                      <option value="Inhaled">Inhaled</option>
                      <option value="Sublingual">Sublingual</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Frequency * (e.g. TDS, BD)"
                      value={item.frequency}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "frequency",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                    <input
                      type="text"
                      placeholder="Duration * (e.g. 7 days)"
                      value={item.duration}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "duration",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                    <input
                      type="text"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "quantity",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                    <input
                      type="text"
                      placeholder="Special instructions"
                      value={item.instructions}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          item.id,
                          "instructions",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addPrescriptionItem}
                className="inline-flex items-center gap-1 text-[#0A6E75] text-sm font-medium hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another medication
              </button>
            </div>
          )}

          {/* Investigation form */}
          {showInvestigationForm && (
            <div className="mb-4 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#0D1F3C]">
                  Investigations
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInvestigationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {investigationItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-lg border border-gray-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Order {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInvestigationItem(item.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={item.type}
                      onChange={(e) =>
                        updateInvestigationItem(
                          item.id,
                          "type",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    >
                      <option value="LAB">Lab</option>
                      <option value="IMAGING">Imaging</option>
                      <option value="PATHOLOGY">Pathology</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <InvestigationPicker
                      currentValue={item.name}
                      onSelect={(inv) => {
                        updateInvestigationItem(item.id, "name", inv.name);
                        updateInvestigationItem(item.id, "type", inv.type);
                      }}
                    />
                    <select
                      value={item.urgency}
                      onChange={(e) =>
                        updateInvestigationItem(
                          item.id,
                          "urgency",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent</option>
                      <option value="STAT">STAT</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Instructions (optional)"
                      value={item.instructions}
                      onChange={(e) =>
                        updateInvestigationItem(
                          item.id,
                          "instructions",
                          e.target.value,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addInvestigationItem}
                className="inline-flex items-center gap-1 text-[#0A6E75] text-sm font-medium hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another investigation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Action Bar ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/doctor/emr/${patientId}`)}
            disabled={saving}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveEncounter("DRAFT")}
            disabled={saving}
            className="rounded-xl border border-[#0A6E75] text-[#0A6E75] px-5 py-2.5 text-sm font-medium hover:bg-[#0A6E75]/5 disabled:opacity-50 flex items-center gap-1"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={() => setShowSignConfirm(true)}
            disabled={saving}
            className="rounded-xl bg-[#0A6E75] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#0A6E75]/90 disabled:opacity-50 flex items-center gap-1"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign and close
          </button>
        </div>
      </div>

      </div>{/* end encounter form column */}

      {/* CDSS Panel — right column on desktop, below form on mobile */}
      <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <CDSSPanel
          patientId={patientId}
          encounterId={encounterId ?? undefined}
          diagnosisText={primaryDiagnosis || assessment}
          newDrugAdded={lastDrugAdded}
        />
      </div>
      </div>{/* end main grid */}

      {/* Sign Confirmation Dialog */}
      {showSignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-[#0D1F3C]">
                Sign encounter note
              </h3>
            </div>
            <p className="text-base text-gray-600">
              By signing this note, you confirm it is an accurate record of the
              clinical encounter. Signed notes cannot be edited. Proceed?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSignConfirm(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignConfirm(false);
                  saveEncounter("SIGNED");
                }}
                disabled={saving}
                className="rounded-xl bg-[#0A6E75] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0A6E75]/90 disabled:opacity-50 flex items-center gap-1"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign and close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewEncounterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D1F3C]" />
        </div>
      }
    >
      <EncounterContent />
    </Suspense>
  );
}
