"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  Droplets,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  FlaskConical,
  Clock,
  Download,
  Shield,
  Pill,
  Heart,
  Thermometer,
  Activity,
  Wind,
  X,
  Check,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatientUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  role: string;
}

interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  user: PatientUser;
}

interface Allergy {
  id: string;
  allergen: string;
  allergyType: string;
  reaction: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface Problem {
  id: string;
  problem: string;
  icdCode: string | null;
  status: string;
  onsetDate: string | null;
  createdAt: string;
}

interface Medication {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  form: string | null;
  route: string | null;
  status: string;
  startDate: string;
}

interface VitalSign {
  id: string;
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  temperature: number | null;
  oxygenSat: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  respiratoryRate: number | null;
  recordedAt: string;
}

interface Encounter {
  id: string;
  encounterType: string;
  encounterDate: string;
  chiefComplaint: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  primaryDiagnosis: string | null;
  status: string;
  signedAt: string | null;
  doctor: {
    id: string;
    user: { name: string };
  };
  createdAt: string;
}

interface Investigation {
  id: string;
  type: string;
  name: string;
  urgency: string;
  status: string;
  instructions: string | null;
  createdAt: string;
  result: LabResult | null;
}

interface LabResult {
  id: string;
  testName: string;
  labName: string | null;
  reportDate: string;
  documentUrl: string | null;
  isAbnormal: boolean;
  interpretation: string | null;
  results: Array<{
    test: string;
    value: string;
    unit: string;
    refRange: string;
    flag: string;
  }> | null;
}

interface ClinicalDocument {
  id: string;
  type: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

interface AccessLogEntry {
  id: string;
  accessedById: string;
  action: string;
  resourceType: string;
  accessedAt: string;
}

interface PatientSummary {
  patient: PatientProfile;
  allergies: Allergy[];
  problemList: Problem[];
  currentMedications: Medication[];
  latestVitals: VitalSign | null;
  encounters: Encounter[];
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

let toastId = 0;

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

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function severityColor(severity: string) {
  switch (severity) {
    case "MILD":
      return "bg-amber-100 text-amber-800";
    case "MODERATE":
      return "bg-orange-100 text-orange-800";
    case "SEVERE":
      return "bg-red-100 text-red-800";
    case "LIFE_THREATENING":
      return "bg-red-200 text-red-900";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-amber-100 text-amber-800";
    case "SIGNED":
      return "bg-green-100 text-green-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "RESOLVED":
      return "bg-gray-100 text-gray-600";
    case "ORDERED":
      return "bg-blue-100 text-blue-800";
    case "COLLECTED":
      return "bg-purple-100 text-purple-800";
    case "RESULTED":
      return "bg-green-100 text-green-800";
    case "REVIEWED":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function urgencyBadge(urgency: string) {
  switch (urgency) {
    case "STAT":
      return "bg-red-100 text-red-800";
    case "URGENT":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function encounterTypeBadge(type: string) {
  switch (type) {
    case "CONSULTATION":
      return "bg-blue-100 text-blue-800";
    case "FOLLOW_UP":
      return "bg-teal-100 text-teal-800";
    case "PROCEDURE":
      return "bg-purple-100 text-purple-800";
    case "EMERGENCY":
      return "bg-red-100 text-red-800";
    case "SECOND_OPINION":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function docTypeBadge(type: string) {
  switch (type) {
    case "LAB_REPORT":
      return "bg-green-100 text-green-800";
    case "IMAGING":
      return "bg-blue-100 text-blue-800";
    case "REFERRAL_LETTER":
      return "bg-purple-100 text-purple-800";
    case "PRESCRIPTION":
      return "bg-teal-100 text-teal-800";
    case "DISCHARGE_SUMMARY":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-200 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function MainSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EMRPatientViewPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();

  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "encounters" | "investigations" | "documents" | "access"
  >("encounters");

  // Inline form toggles
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // Encounters tab data
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [encountersLoading, setEncountersLoading] = useState(false);
  const [expandedEncounters, setExpandedEncounters] = useState<Set<string>>(new Set());

  // Investigations tab data
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [investigationsLoading, setInvestigationsLoading] = useState(false);

  // Documents tab data
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState("");

  // Access log data
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch patient summary
  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/emr/patient/${patientId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch patient");
        }
        const data: PatientSummary = await res.json();
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, [patientId]);

  // Fetch encounters
  const fetchEncounters = useCallback(async () => {
    setEncountersLoading(true);
    try {
      const res = await fetch(
        `/api/emr/encounters?patientId=${patientId}&limit=50`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setEncounters(data.encounters || []);
      }
    } catch {
      /* silent */
    } finally {
      setEncountersLoading(false);
    }
  }, [patientId]);

  // Fetch investigations
  const fetchInvestigations = useCallback(async () => {
    setInvestigationsLoading(true);
    try {
      const res = await fetch(
        `/api/emr/investigations?patientId=${patientId}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data || []);
      }
    } catch {
      /* silent */
    } finally {
      setInvestigationsLoading(false);
    }
  }, [patientId]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const url = docTypeFilter
        ? `/api/emr/documents?patientId=${patientId}&type=${docTypeFilter}`
        : `/api/emr/documents?patientId=${patientId}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      }
    } catch {
      /* silent */
    } finally {
      setDocumentsLoading(false);
    }
  }, [patientId, docTypeFilter]);

  // Fetch access logs
  const fetchAccessLogs = useCallback(async () => {
    setAccessLoading(true);
    try {
      const res = await fetch(
        `/api/emr/access/log?patientId=${patientId}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setAccessLogs(data || []);
      }
    } catch {
      /* silent */
    } finally {
      setAccessLoading(false);
    }
  }, [patientId]);

  // Load tab data on tab change
  useEffect(() => {
    if (activeTab === "encounters") fetchEncounters();
    if (activeTab === "investigations") fetchInvestigations();
    if (activeTab === "documents") fetchDocuments();
    if (activeTab === "access") fetchAccessLogs();
  }, [activeTab, fetchEncounters, fetchInvestigations, fetchDocuments, fetchAccessLogs]);

  // Refetch documents when type filter changes
  useEffect(() => {
    if (activeTab === "documents") fetchDocuments();
  }, [docTypeFilter, activeTab, fetchDocuments]);

  const toggleEncounter = (id: string) => {
    setExpandedEncounters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Refresh summary sidebar data
  const refreshSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/emr/patient/${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      /* silent */
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-80 shrink-0">
            <SidebarSkeleton />
          </div>
          <div className="flex-1">
            <MainSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/doctor/emr")}
          className="flex items-center gap-2 text-[#0A6E75] font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 text-base">
          {error || "Patient not found"}
        </div>
      </div>
    );
  }

  const { patient, allergies, problemList, currentMedications, latestVitals } =
    summary;

  const hasLifeThreateningAllergy = allergies.some(
    (a) => a.severity === "LIFE_THREATENING" && a.status === "ACTIVE",
  );

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <button
        onClick={() => router.push("/doctor/emr")}
        className="flex items-center gap-2 text-[#0A6E75] font-medium hover:underline text-base"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </button>

      {/* Life-threatening allergy banner */}
      {hasLifeThreateningAllergy && (
        <div className="rounded-xl bg-red-600 text-white p-3 flex items-center gap-2 font-medium text-base">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          LIFE-THREATENING ALLERGY:{" "}
          {allergies
            .filter(
              (a) =>
                a.severity === "LIFE_THREATENING" && a.status === "ACTIVE",
            )
            .map((a) => a.allergen)
            .join(", ")}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Left Sidebar ─────────────────────────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-4 lg:self-start space-y-5">
          {/* Patient identity */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4 mb-4">
              {patient.user.profileImage ? (
                <img
                  src={patient.user.profileImage}
                  alt={patient.user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#0A6E75]/10 text-[#0A6E75] flex items-center justify-center font-bold text-lg">
                  {getInitials(patient.user.name)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-[#0D1F3C]">
                  {patient.user.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  {patient.dateOfBirth && (
                    <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                  )}
                  {patient.gender && <span>{patient.gender}</span>}
                  {patient.bloodGroup && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs font-semibold">
                      <Droplets className="h-3 w-3" />
                      {patient.bloodGroup}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0D1F3C] text-sm uppercase tracking-wide">
                Allergies
              </h3>
              <button
                onClick={() => setShowAllergyForm(!showAllergyForm)}
                className="text-[#0A6E75] text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {allergies.filter((a) => a.status === "ACTIVE").length === 0 && (
              <p className="text-sm text-gray-400">No known allergies</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {allergies
                .filter((a) => a.status === "ACTIVE")
                .map((a) => (
                  <span
                    key={a.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${severityColor(a.severity)}`}
                    title={`${a.reaction} (${a.allergyType})`}
                  >
                    {a.severity === "LIFE_THREATENING" && (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {a.allergen}
                  </span>
                ))}
            </div>
            {showAllergyForm && (
              <AllergyForm
                patientId={patientId}
                onClose={() => setShowAllergyForm(false)}
                onSuccess={() => {
                  setShowAllergyForm(false);
                  refreshSummary();
                  addToast("success", "Allergy added successfully");
                }}
                onError={(msg) => addToast("error", msg)}
              />
            )}
          </div>

          {/* Active Problems */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0D1F3C] text-sm uppercase tracking-wide">
                Active Problems
              </h3>
              <button
                onClick={() => setShowProblemForm(!showProblemForm)}
                className="text-[#0A6E75] text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {problemList.filter((p) => p.status === "ACTIVE").length === 0 && (
              <p className="text-sm text-gray-400">No active problems</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {problemList
                .filter((p) => p.status === "ACTIVE")
                .map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 px-2.5 py-1 text-xs font-medium"
                    title={p.icdCode || undefined}
                  >
                    {p.problem}
                    {p.icdCode && (
                      <span className="ml-1 text-blue-500 text-[10px]">
                        ({p.icdCode})
                      </span>
                    )}
                  </span>
                ))}
            </div>
            {showProblemForm && (
              <ProblemForm
                patientId={patientId}
                onClose={() => setShowProblemForm(false)}
                onSuccess={() => {
                  setShowProblemForm(false);
                  refreshSummary();
                  addToast("success", "Problem added successfully");
                }}
                onError={(msg) => addToast("error", msg)}
              />
            )}
          </div>

          {/* Current Medications */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0D1F3C] text-sm uppercase tracking-wide">
                Current Medications
              </h3>
              <button
                onClick={() =>
                  router.push(`/doctor/emr/${patientId}/encounter`)
                }
                className="text-[#0A6E75] text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Prescribe
              </button>
            </div>
            {currentMedications.length === 0 && (
              <p className="text-sm text-gray-400">No current medications</p>
            )}
            <div className="space-y-2">
              {currentMedications.map((med) => (
                <div key={med.id} className="text-sm">
                  <p className="font-medium text-[#0D1F3C]">{med.drugName}</p>
                  <p className="text-gray-500">
                    {med.dose} &middot; {med.frequency}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Vitals */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0D1F3C] text-sm uppercase tracking-wide">
                Latest Vitals
              </h3>
              <button
                onClick={() => setShowVitalsModal(true)}
                className="text-[#0A6E75] text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Record
              </button>
            </div>
            {!latestVitals && (
              <p className="text-sm text-gray-400">No vitals recorded</p>
            )}
            {latestVitals && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {latestVitals.systolicBP != null &&
                    latestVitals.diastolicBP != null && (
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-gray-600">BP:</span>
                        <span className="font-medium">
                          {latestVitals.systolicBP}/{latestVitals.diastolicBP}
                        </span>
                      </div>
                    )}
                  {latestVitals.heartRate != null && (
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-pink-500" />
                      <span className="text-gray-600">HR:</span>
                      <span className="font-medium">
                        {latestVitals.heartRate}
                      </span>
                    </div>
                  )}
                  {latestVitals.temperature != null && (
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-gray-600">Temp:</span>
                      <span className="font-medium">
                        {latestVitals.temperature}&deg;C
                      </span>
                    </div>
                  )}
                  {latestVitals.oxygenSat != null && (
                    <div className="flex items-center gap-1.5">
                      <Wind className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-gray-600">SpO2:</span>
                      <span className="font-medium">
                        {latestVitals.oxygenSat}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Recorded{" "}
                  {new Date(latestVitals.recordedAt).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Main Area ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
            {(
              [
                { key: "encounters", label: "Encounters", icon: FileText },
                {
                  key: "investigations",
                  label: "Investigations",
                  icon: FlaskConical,
                },
                { key: "documents", label: "Documents", icon: FileText },
                { key: "access", label: "Access Log", icon: Shield },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? "border-[#0A6E75] text-[#0A6E75]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "encounters" && (
            <EncountersTab
              encounters={encounters}
              loading={encountersLoading}
              expandedEncounters={expandedEncounters}
              onToggle={toggleEncounter}
              onNewEncounter={() =>
                router.push(`/doctor/emr/${patientId}/encounter`)
              }
            />
          )}
          {activeTab === "investigations" && (
            <InvestigationsTab
              investigations={investigations}
              loading={investigationsLoading}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsTab
              documents={documents}
              loading={documentsLoading}
              docTypeFilter={docTypeFilter}
              onFilterChange={setDocTypeFilter}
            />
          )}
          {activeTab === "access" && (
            <AccessLogTab logs={accessLogs} loading={accessLoading} />
          )}
        </div>
      </div>

      {/* Vitals Modal */}
      {showVitalsModal && (
        <VitalsModal
          patientId={patientId}
          onClose={() => setShowVitalsModal(false)}
          onSuccess={() => {
            setShowVitalsModal(false);
            refreshSummary();
            addToast("success", "Vitals recorded successfully");
          }}
          onError={(msg) => addToast("error", msg)}
        />
      )}
    </div>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────────────

function EncountersTab({
  encounters,
  loading,
  expandedEncounters,
  onToggle,
  onNewEncounter,
}: {
  encounters: Encounter[];
  loading: boolean;
  expandedEncounters: Set<string>;
  onToggle: (id: string) => void;
  onNewEncounter: () => void;
}) {
  if (loading) return <MainSkeleton />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onNewEncounter}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0A6E75] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0A6E75]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New encounter
        </button>
      </div>

      {encounters.length === 0 && (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-base">No encounters recorded yet.</p>
        </div>
      )}

      {encounters.map((enc) => {
        const expanded = expandedEncounters.has(enc.id);
        return (
          <div
            key={enc.id}
            className="rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => onToggle(enc.id)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm text-gray-500">
                      {new Date(enc.encounterDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${encounterTypeBadge(enc.encounterType)}`}
                    >
                      {enc.encounterType.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(enc.status)}`}
                    >
                      {enc.status}
                    </span>
                  </div>
                  <p className="font-medium text-[#0D1F3C] text-base">
                    {enc.chiefComplaint}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {enc.doctor.user.name}
                  </p>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                )}
              </div>
            </button>

            {expanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                {enc.subjective && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Subjective
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {enc.subjective}
                    </p>
                  </div>
                )}
                {enc.objective && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Objective
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {enc.objective}
                    </p>
                  </div>
                )}
                {enc.assessment && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Assessment
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {enc.assessment}
                    </p>
                  </div>
                )}
                {enc.plan && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Plan
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {enc.plan}
                    </p>
                  </div>
                )}
                {enc.primaryDiagnosis && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                      Primary Diagnosis
                    </h4>
                    <p className="text-sm text-gray-700">
                      {enc.primaryDiagnosis}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InvestigationsTab({
  investigations,
  loading,
}: {
  investigations: Investigation[];
  loading: boolean;
}) {
  if (loading) return <MainSkeleton />;

  const pending = investigations.filter(
    (i) => i.status === "ORDERED" || i.status === "COLLECTED",
  );
  const resulted = investigations.filter(
    (i) => i.status === "RESULTED" || i.status === "REVIEWED",
  );

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <h3 className="font-semibold text-[#0D1F3C] mb-3 text-base">
          Pending ({pending.length})
        </h3>
        {pending.length === 0 && (
          <p className="text-sm text-gray-400">No pending investigations</p>
        )}
        <div className="space-y-2">
          {pending.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#0D1F3C] text-base">
                    {inv.name}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${urgencyBadge(inv.urgency)}`}
                  >
                    {inv.urgency}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(inv.status)}`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {inv.type} &middot; Ordered{" "}
                  {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h3 className="font-semibold text-[#0D1F3C] mb-3 text-base">
          Results ({resulted.length})
        </h3>
        {resulted.length === 0 && (
          <p className="text-sm text-gray-400">No results yet</p>
        )}
        <div className="space-y-2">
          {resulted.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[#0D1F3C] text-base">
                  {inv.name}
                </span>
                {inv.result?.isAbnormal && (
                  <span className="inline-flex rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs font-medium">
                    ABNORMAL
                  </span>
                )}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(inv.status)}`}
                >
                  {inv.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {inv.type} &middot;{" "}
                {inv.result
                  ? new Date(inv.result.reportDate).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : ""}
              </p>
              {inv.result?.interpretation && (
                <p className="text-sm text-gray-700 mt-2">
                  {inv.result.interpretation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({
  documents,
  loading,
  docTypeFilter,
  onFilterChange,
}: {
  documents: ClinicalDocument[];
  loading: boolean;
  docTypeFilter: string;
  onFilterChange: (v: string) => void;
}) {
  const docTypes = [
    "",
    "LAB_REPORT",
    "IMAGING",
    "REFERRAL_LETTER",
    "SPECIALIST_REPORT",
    "SECOND_OPINION",
    "CONSENT_FORM",
    "DISCHARGE_SUMMARY",
    "PRESCRIPTION",
    "OTHER",
  ];

  if (loading) return <MainSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={docTypeFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
        >
          {docTypes.map((t) => (
            <option key={t} value={t}>
              {t ? t.replace(/_/g, " ") : "All types"}
            </option>
          ))}
        </select>
      </div>

      {documents.length === 0 && (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-base">No documents found.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="rounded-xl border border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${docTypeBadge(doc.type)}`}
              >
                {doc.type.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-gray-400">
                {doc.fileType}
              </span>
            </div>
            <p className="font-medium text-[#0D1F3C] text-base">{doc.title}</p>
            {doc.description && (
              <p className="text-sm text-gray-500">{doc.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0A6E75] text-sm font-medium hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccessLogTab({
  logs,
  loading,
}: {
  logs: AccessLogEntry[];
  loading: boolean;
}) {
  if (loading) return <MainSkeleton />;

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center">
        <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-base">No access logs recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                User
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Action
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Resource
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                Date/Time
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-3 text-gray-700">
                  {log.accessedById.slice(0, 8)}...
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.action === "CREATED"
                        ? "bg-green-100 text-green-800"
                        : log.action === "UPDATED"
                          ? "bg-blue-100 text-blue-800"
                          : log.action === "DOWNLOADED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {log.resourceType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(log.accessedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inline Forms ────────────────────────────────────────────────────────────

function AllergyForm({
  patientId,
  onClose,
  onSuccess,
  onError,
}: {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [allergen, setAllergen] = useState("");
  const [allergyType, setAllergyType] = useState("DRUG");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState("MILD");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allergen.trim() || !reaction.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/emr/allergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId,
          allergen: allergen.trim(),
          allergyType,
          reaction: reaction.trim(),
          severity,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add allergy");
      }
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add allergy");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <input
        type="text"
        placeholder="Allergen *"
        value={allergen}
        onChange={(e) => setAllergen(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      />
      <select
        value={allergyType}
        onChange={(e) => setAllergyType(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      >
        <option value="DRUG">Drug</option>
        <option value="FOOD">Food</option>
        <option value="ENVIRONMENTAL">Environmental</option>
        <option value="OTHER">Other</option>
      </select>
      <input
        type="text"
        placeholder="Reaction *"
        value={reaction}
        onChange={(e) => setReaction(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      />
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      >
        <option value="MILD">Mild</option>
        <option value="MODERATE">Moderate</option>
        <option value="SEVERE">Severe</option>
        <option value="LIFE_THREATENING">Life-threatening</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-[#0A6E75] text-white px-3 py-2 text-sm font-medium hover:bg-[#0A6E75]/90 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProblemForm({
  patientId,
  onClose,
  onSuccess,
  onError,
}: {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [problem, setProblem] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!problem.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/emr/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId,
          problem: problem.trim(),
          icdCode: icdCode.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add problem");
      }
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add problem");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <input
        type="text"
        placeholder="Problem name *"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        required
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      />
      <input
        type="text"
        placeholder="ICD-10 code (optional)"
        value={icdCode}
        onChange={(e) => setIcdCode(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-[#0A6E75] text-white px-3 py-2 text-sm font-medium hover:bg-[#0A6E75]/90 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function VitalsModal({
  patientId,
  onClose,
  onSuccess,
  onError,
}: {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [systolicBP, setSystolicBP] = useState("");
  const [diastolicBP, setDiastolicBP] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSat, setOxygenSat] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [saving, setSaving] = useState(false);

  const bmi =
    weight && height
      ? (
          parseFloat(weight) /
          (parseFloat(height) / 100) ** 2
        ).toFixed(1)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/emr/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId,
          systolicBP: systolicBP || undefined,
          diastolicBP: diastolicBP || undefined,
          heartRate: heartRate || undefined,
          temperature: temperature || undefined,
          oxygenSat: oxygenSat || undefined,
          weight: weight || undefined,
          height: height || undefined,
          respiratoryRate: respiratoryRate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record vitals");
      }
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to record vitals");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#0D1F3C]">Record Vitals</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="&deg;C"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resp. Rate
              </label>
              <input
                type="number"
                placeholder="/min"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
          </div>
          {bmi && !isNaN(parseFloat(bmi)) && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              Calculated BMI: <span className="font-semibold">{bmi}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#0A6E75] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#0A6E75]/90 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save vitals
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
