"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import {
  Heart,
  Pill,
  Stethoscope,
  FlaskConical,
  FileText,
  Shield,
  Eye,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Trash2,
  Clock,
  User,
  Lock,
} from "lucide-react";

// ─── Skeleton loader ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────
interface Allergy {
  id: string;
  allergen: string;
  type: string;
  reaction: string;
  severity: string;
  reportedAt: string;
}

interface ActiveProblem {
  id: string;
  name: string;
  status: string;
  onsetDate?: string;
  recordedBy?: { user: { name: string } };
}

interface Medication {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  prescribedBy: { user: { name: string } };
  prescribedDate: string;
  status: string;
}

interface Encounter {
  id: string;
  date: string;
  type: string;
  physician: { user: { name: string } };
  chiefComplaint: string;
  assessment?: string;
  plan?: string;
  isConfidential: boolean;
}

interface LabResult {
  id: string;
  testName: string;
  result: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  date: string;
  documentUrl?: string;
}

interface ClinicalDocument {
  id: string;
  type: string;
  title: string;
  date: string;
  documentUrl: string;
  isPatientVisible: boolean;
}

interface AccessGrant {
  id: string;
  physician: { user: { name: string } };
  accessLevel: string;
  grantedDate: string;
  expiresAt?: string;
}

interface AccessLogEntry {
  id: string;
  accessedBy: { name: string; role: string };
  accessedAt: string;
  resourceAccessed: string;
}

interface ConsentSettings {
  telemedicine: boolean;
  secondOpinionDataSharing: boolean;
  dataProcessing: boolean;
}

interface HealthRecordProps {
  patientId: string;
  bloodGroup?: string;
}

// ─── Main Component ──────────────────────────────────────────────
export default function HealthRecord({ patientId, bloodGroup }: HealthRecordProps) {
  const { addToast } = useToast();

  // --- Section data state ---
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [activeProblems, setActiveProblems] = useState<ActiveProblem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [consent, setConsent] = useState<ConsentSettings>({
    telemedicine: false,
    secondOpinionDataSharing: false,
    dataProcessing: false,
  });

  // --- Loading state ---
  const [loadingAllergies, setLoadingAllergies] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [loadingEncounters, setLoadingEncounters] = useState(true);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [loadingAccessLog, setLoadingAccessLog] = useState(true);
  const [loadingConsent, setLoadingConsent] = useState(true);

  // --- UI state ---
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);
  const [submittingAllergy, setSubmittingAllergy] = useState(false);
  const [expandedEncounterId, setExpandedEncounterId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);

  // --- Allergy form ---
  const [allergyForm, setAllergyForm] = useState({
    allergen: "",
    type: "",
    reaction: "",
    severity: "",
  });

  // ─── Data fetching ─────────────────────────────────────────────
  const fetchAllergies = useCallback(async () => {
    setLoadingAllergies(true);
    try {
      const res = await fetch(`/api/emr/allergies?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAllergies(data.allergies ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingAllergies(false);
    }
  }, [patientId]);

  const fetchMedications = useCallback(async () => {
    setLoadingMedications(true);
    try {
      const res = await fetch(`/api/emr/medications?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingMedications(false);
    }
  }, [patientId]);

  const fetchEncounters = useCallback(async () => {
    setLoadingEncounters(true);
    try {
      const res = await fetch(`/api/emr/encounters?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEncounters(
          (data.encounters ?? data ?? []).filter(
            (e: Encounter) => !e.isConfidential
          )
        );
      }
    } catch {
      // silent
    } finally {
      setLoadingEncounters(false);
    }
  }, [patientId]);

  const fetchLabResults = useCallback(async () => {
    setLoadingLabs(true);
    try {
      const res = await fetch(`/api/emr/lab-results?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLabResults(data.labResults ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingLabs(false);
    }
  }, [patientId]);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const res = await fetch(`/api/emr/documents?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingDocuments(false);
    }
  }, [patientId]);

  const fetchAccessGrants = useCallback(async () => {
    setLoadingAccess(true);
    try {
      const res = await fetch(`/api/emr/access?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAccessGrants(data.grants ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingAccess(false);
    }
  }, [patientId]);

  const fetchAccessLog = useCallback(async () => {
    setLoadingAccessLog(true);
    try {
      const res = await fetch(`/api/emr/access/log?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAccessLog(data.log ?? data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingAccessLog(false);
    }
  }, [patientId]);

  const fetchConsent = useCallback(async () => {
    setLoadingConsent(true);
    try {
      const res = await fetch(`/api/emr/consent?patientId=${patientId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setConsent({
          telemedicine: data.telemedicine ?? false,
          secondOpinionDataSharing: data.secondOpinionDataSharing ?? false,
          dataProcessing: data.dataProcessing ?? false,
        });
      }
    } catch {
      // silent
    } finally {
      setLoadingConsent(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    fetchAllergies();
    fetchMedications();
    fetchEncounters();
    fetchLabResults();
    fetchDocuments();
    fetchAccessGrants();
    fetchAccessLog();
    fetchConsent();
  }, [
    patientId,
    fetchAllergies,
    fetchMedications,
    fetchEncounters,
    fetchLabResults,
    fetchDocuments,
    fetchAccessGrants,
    fetchAccessLog,
    fetchConsent,
  ]);

  // ─── Actions ───────────────────────────────────────────────────
  const handleSubmitAllergy = async () => {
    if (!allergyForm.allergen || !allergyForm.type || !allergyForm.reaction || !allergyForm.severity) {
      addToast({ title: "Validation", description: "Please fill in all fields", type: "error" });
      return;
    }
    setSubmittingAllergy(true);
    try {
      const res = await fetch("/api/emr/allergies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...allergyForm, patientId }),
      });
      if (res.ok) {
        addToast({ title: "Allergy reported", description: "Your allergy has been recorded", type: "success" });
        setAllergyDialogOpen(false);
        setAllergyForm({ allergen: "", type: "", reaction: "", severity: "" });
        fetchAllergies();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast({ title: "Error", description: errData.error ?? "Failed to report allergy", type: "error" });
      }
    } catch {
      addToast({ title: "Error", description: "Network error", type: "error" });
    } finally {
      setSubmittingAllergy(false);
    }
  };

  const handleRevokeAccess = async (grantId: string) => {
    setRevokingId(grantId);
    try {
      const res = await fetch(`/api/emr/access/${grantId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        addToast({ title: "Access revoked", description: "Physician access has been revoked", type: "success" });
        fetchAccessGrants();
      } else {
        addToast({ title: "Error", description: "Failed to revoke access", type: "error" });
      }
    } catch {
      addToast({ title: "Error", description: "Network error", type: "error" });
    } finally {
      setRevokingId(null);
    }
  };

  const handleConsentToggle = async (key: keyof ConsentSettings) => {
    const updated = { ...consent, [key]: !consent[key] };
    setConsent(updated);
    setSavingConsent(true);
    try {
      const res = await fetch("/api/emr/consent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updated, patientId }),
      });
      if (res.ok) {
        addToast({ title: "Consent updated", description: "Your preferences have been saved", type: "success" });
      } else {
        setConsent({ ...consent }); // rollback
        addToast({ title: "Error", description: "Failed to update consent", type: "error" });
      }
    } catch {
      setConsent({ ...consent }); // rollback
      addToast({ title: "Error", description: "Network error", type: "error" });
    } finally {
      setSavingConsent(false);
    }
  };

  const severityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
      case "high":
        return "bg-red-100 text-red-800";
      case "moderate":
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "mild":
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Section 1: Medical Profile ───────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Medical Profile</CardTitle>
          </div>
          <CardDescription>Your core medical information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blood Group */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Blood Group</Label>
            <p className="mt-1 text-lg font-semibold text-[#0D1F3C]">
              {bloodGroup || "Not set"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Update your blood group from the Profile tab</p>
          </div>

          <Separator />

          {/* Allergies */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Allergies</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAllergyDialogOpen(true)}
                className="text-[#0A6E75] border-[#0A6E75] hover:bg-[#0A6E75]/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Self-report allergy
              </Button>
            </div>
            {loadingAllergies ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : allergies.length === 0 ? (
              <p className="text-gray-500 text-sm py-3">No allergies on record</p>
            ) : (
              <div className="space-y-2">
                {allergies.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{a.allergen}</p>
                      <p className="text-sm text-gray-600">
                        {a.type} &middot; Reaction: {a.reaction}
                      </p>
                    </div>
                    <Badge className={severityColor(a.severity)}>{a.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Active Problems */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Active Problems</Label>
            <p className="text-xs text-gray-500 mb-3">Managed by your physician</p>
            {loadingAllergies ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
              </div>
            ) : activeProblems.length === 0 ? (
              <p className="text-gray-500 text-sm py-3">No active problems recorded</p>
            ) : (
              <div className="space-y-2">
                {activeProblems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.onsetDate && (
                        <p className="text-sm text-gray-600">
                          Onset: {format(new Date(p.onsetDate), "MMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Allergy Dialog ───────────────────────────────────── */}
      <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Self-report an allergy</DialogTitle>
            <DialogDescription>
              Report a known allergy. Your physician may review and verify this.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="allergen">Allergen</Label>
              <Input
                id="allergen"
                placeholder="e.g. Penicillin, Peanuts"
                value={allergyForm.allergen}
                onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="allergyType">Type</Label>
              <Select
                value={allergyForm.type}
                onValueChange={(v) => setAllergyForm({ ...allergyForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Drug">Drug</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Environmental">Environmental</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reaction">Reaction</Label>
              <Textarea
                id="reaction"
                placeholder="Describe the reaction..."
                value={allergyForm.reaction}
                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={allergyForm.severity}
                onValueChange={(v) => setAllergyForm({ ...allergyForm, severity: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={submittingAllergy}>Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmitAllergy}
              disabled={submittingAllergy}
              className="bg-[#0A6E75] hover:bg-[#0A6E75]/90"
            >
              {submittingAllergy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Section 2: Medication History ────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Medication History</CardTitle>
          </div>
          <CardDescription>
            <Lock className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
            Managed by your physician &mdash; view only
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMedications ? (
            <TableSkeleton rows={3} />
          ) : medications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No medications on record</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Drug</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Dose</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Frequency</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Prescribed by</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medications.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/40">
                      <td className="px-6 py-3 font-medium text-gray-900">{m.drugName}</td>
                      <td className="px-4 py-3 text-gray-700">{m.dose}</td>
                      <td className="px-4 py-3 text-gray-700">{m.frequency}</td>
                      <td className="px-4 py-3 text-gray-700">Dr. {m.prescribedBy.user.name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {format(new Date(m.prescribedDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            m.status.toLowerCase() === "active"
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-gray-300 text-gray-600"
                          }
                        >
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Consultation History ──────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Consultation History</CardTitle>
          </div>
          <CardDescription>Past encounters with your physicians</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEncounters ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : encounters.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No consultations recorded</p>
          ) : (
            <div className="space-y-3">
              {encounters.map((enc) => {
                const isExpanded = expandedEncounterId === enc.id;
                return (
                  <div key={enc.id} className="border rounded-lg">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/60 transition-colors"
                      onClick={() =>
                        setExpandedEncounterId(isExpanded ? null : enc.id)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-[#0A6E75] shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {enc.chiefComplaint}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {format(new Date(enc.date), "MMM dd, yyyy")} &middot;{" "}
                            {enc.type} &middot; Dr. {enc.physician.user.name}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (enc.assessment || enc.plan) && (
                      <div className="border-t px-4 py-3 space-y-3 bg-gray-50/40">
                        {enc.assessment && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                              Assessment
                            </p>
                            <p className="text-sm text-gray-800">{enc.assessment}</p>
                          </div>
                        )}
                        {enc.plan && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                              Plan
                            </p>
                            <p className="text-sm text-gray-800">{enc.plan}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4: Investigation Results ─────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Investigation Results</CardTitle>
          </div>
          <CardDescription>Lab and diagnostic test results</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLabs ? (
            <TableSkeleton rows={3} />
          ) : labResults.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No results available</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Test</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {labResults.map((lr) => (
                    <tr key={lr.id} className={`hover:bg-gray-50/40 ${lr.isAbnormal ? "bg-red-50/40" : ""}`}>
                      <td className="px-6 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {lr.testName}
                          {lr.isAbnormal && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${lr.isAbnormal ? "text-red-700 font-semibold" : "text-gray-700"}`}>
                        {lr.result}
                        {lr.unit && ` ${lr.unit}`}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{lr.referenceRange || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {format(new Date(lr.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {lr.documentUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="text-[#0A6E75]"
                          >
                            <a href={lr.documentUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Documents ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Documents</CardTitle>
          </div>
          <CardDescription>Your clinical documents and reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No documents available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 flex items-start justify-between hover:bg-gray-50/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 border-[#0A6E75]/30 text-[#0A6E75]"
                      >
                        {doc.type}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(doc.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="text-[#0A6E75] shrink-0 ml-2"
                  >
                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 6: Privacy & Consent ─────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Privacy &amp; Consent</CardTitle>
          </div>
          <CardDescription>Manage who can access your records and your consent preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Access Grants */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Active Record Access</h4>
            {loadingAccess ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : accessGrants.length === 0 ? (
              <p className="text-gray-500 text-sm py-3">No active access grants</p>
            ) : (
              <div className="space-y-2">
                {accessGrants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. {grant.physician.user.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {grant.accessLevel} &middot; Granted{" "}
                        {format(new Date(grant.grantedDate), "MMM dd, yyyy")}
                        {grant.expiresAt && (
                          <> &middot; Expires {format(new Date(grant.expiresAt), "MMM dd, yyyy")}</>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={revokingId === grant.id}
                      onClick={() => handleRevokeAccess(grant.id)}
                    >
                      {revokingId === grant.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Consent Toggles */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4">Consent Preferences</h4>
            {loadingConsent ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Telemedicine</p>
                    <p className="text-xs text-gray-500">Allow consultations via video call</p>
                  </div>
                  <Switch
                    checked={consent.telemedicine}
                    onCheckedChange={() => handleConsentToggle("telemedicine")}
                    disabled={savingConsent}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Second Opinion Data Sharing</p>
                    <p className="text-xs text-gray-500">Share records with second-opinion specialists</p>
                  </div>
                  <Switch
                    checked={consent.secondOpinionDataSharing}
                    onCheckedChange={() => handleConsentToggle("secondOpinionDataSharing")}
                    disabled={savingConsent}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Processing</p>
                    <p className="text-xs text-gray-500">Allow anonymised data for quality improvement</p>
                  </div>
                  <Switch
                    checked={consent.dataProcessing}
                    onCheckedChange={() => handleConsentToggle("dataProcessing")}
                    disabled={savingConsent}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 7: Access Log ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#0A6E75]" />
            <CardTitle>Access Log</CardTitle>
          </div>
          <CardDescription>Who has viewed your records</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAccessLog ? (
            <TableSkeleton rows={4} />
          ) : accessLog.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No access log entries</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">When</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Accessed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accessLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/40">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {entry.accessedBy.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <Badge variant="outline" className="text-xs">
                          {entry.accessedBy.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {format(new Date(entry.accessedAt), "MMM dd, yyyy 'at' h:mm a")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{entry.resourceAccessed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
