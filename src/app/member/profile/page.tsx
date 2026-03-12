"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SPECIALTIES } from "@/lib/specialties";
import {
  Camera,
  User,
  Briefcase,
  MapPin,
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

const TITLE_OPTIONS = ["Dr.", "Prof.", "Mr.", "Mrs."];

const COUNTRIES = [
  "United Kingdom",
  "United States",
  "Nigeria",
  "Canada",
  "Ireland",
  "Germany",
  "Australia",
  "Other",
];

interface ProfileData {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  subSpecialty: string;
  institution: string;
  city: string;
  country: string;
  mdcnLicence: string;
  bio: string;
  whatsappOptIn: boolean;
  profileImage: string;
}

const defaultProfile: ProfileData = {
  title: "",
  fullName: "",
  email: "",
  phone: "",
  specialty: "",
  subSpecialty: "",
  institution: "",
  city: "",
  country: "",
  mdcnLicence: "",
  bio: "",
  whatsappOptIn: false,
  profileImage: "",
};

// --- Credential types ---

const CREDENTIAL_TYPES = [
  "MDCN",
  "GMC",
  "HPCSA",
  "AMA",
  "CPSO",
  "AHPRA",
  "IMC",
  "Other",
];

const ISSUING_BODY_MAP: Record<string, string> = {
  MDCN: "Medical and Dental Council of Nigeria",
  GMC: "General Medical Council (UK)",
  HPCSA: "Health Professions Council of South Africa",
  AMA: "American Medical Association",
  CPSO: "College of Physicians and Surgeons of Ontario",
  AHPRA: "Australian Health Practitioner Regulation Agency",
  IMC: "Irish Medical Council",
};

const CREDENTIAL_COUNTRY_MAP: Record<string, string> = {
  MDCN: "Nigeria",
  GMC: "United Kingdom",
  HPCSA: "South Africa",
  AMA: "United States",
  CPSO: "Canada",
  AHPRA: "Australia",
  IMC: "Ireland",
};

interface Credential {
  id: string;
  type: string;
  registrationNumber: string;
  issuingBody: string;
  country: string;
  status: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  documentUrl: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

interface NewCredentialForm {
  type: string;
  registrationNumber: string;
  issuingBody: string;
  country: string;
  issueDate: string;
  expiryDate: string;
  documentUrl: string;
}

const defaultNewCredential: NewCredentialForm = {
  type: "",
  registrationNumber: "",
  issuingBody: "",
  country: "",
  issueDate: "",
  expiryDate: "",
  documentUrl: "",
};

// --- Profile completion helpers ---

interface ProfileScoreData {
  score: number;
  profileImage: boolean;
  hasVerifiedCredential: boolean;
  bio: string;
  phone: string;
  specialty: string;
  institution: string;
  country: string;
  name: string;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Complete";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 30) return "Basic";
  return "Incomplete";
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-[#0A6E75]";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreBadgeColor(score: number): string {
  if (score >= 90) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 70) return "text-[#0A6E75] bg-[#0A6E75]/5 border-[#0A6E75]/20";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function getMissingItems(data: ProfileScoreData): string[] {
  const missing: string[] = [];
  if (!data.profileImage) missing.push("Profile photo");
  if (!data.hasVerifiedCredential) missing.push("Verified credential");
  if (!data.bio || data.bio.length < 50) missing.push("Bio (min 50 chars)");
  if (!data.phone) missing.push("Phone number");
  if (!data.specialty) missing.push("Specialty");
  if (!data.institution) missing.push("Institution");
  if (!data.country) missing.push("Country");
  if (!data.name) missing.push("Full name");
  return missing;
}

// --- Status helpers ---

function getStatusIcon(status: string) {
  switch (status) {
    case "VERIFIED":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "PENDING":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "REJECTED":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "VERIFIED":
      return { label: "Verified", className: "bg-green-50 text-green-700 border-green-200" };
    case "PENDING":
      return { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "REJECTED":
      return { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" };
    case "EXPIRED":
      return { label: "Expired", className: "bg-gray-100 text-gray-600 border-gray-200" };
    default:
      return { label: "Unverified", className: "bg-gray-100 text-gray-600 border-gray-200" };
  }
}

// --- Section navigation ---
type SectionId = "personal" | "professional" | "location" | "bio" | "credentials";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-4 w-4" /> },
  { id: "professional", label: "Professional", icon: <Briefcase className="h-4 w-4" /> },
  { id: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
  { id: "bio", label: "Bio & Preferences", icon: <FileText className="h-4 w-4" /> },
  { id: "credentials", label: "Credentials", icon: <Shield className="h-4 w-4" /> },
];

// --- Skeleton loader ---
function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-56 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      {/* Completion bar skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="h-4 w-36 bg-gray-200 rounded mb-3" />
        <div className="h-2.5 w-full bg-gray-200 rounded-full" />
      </div>
      {/* Form skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Input component ---
function FormInput({
  label,
  id,
  optional,
  ...props
}: {
  label: string;
  id: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/40 focus:border-[#0A6E75] transition-colors"
        {...props}
      />
    </div>
  );
}

function FormSelect({
  label,
  id,
  options,
  placeholder,
  optional,
  ...props
}: {
  label: string;
  id: string;
  options: readonly string[];
  placeholder: string;
  optional?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>
      <select
        id={id}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/40 focus:border-[#0A6E75] transition-colors"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Section wrapper ---
function SectionCard({
  id,
  title,
  subtitle,
  icon,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden scroll-mt-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <span className="text-[#0A6E75]">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-[#0D1F3C]">{title}</h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function MemberProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile completion state
  const [profileScore, setProfileScore] = useState(0);
  const [scoreData, setScoreData] = useState<ProfileScoreData>({
    score: 0,
    profileImage: false,
    hasVerifiedCredential: false,
    bio: "",
    phone: "",
    specialty: "",
    institution: "",
    country: "",
    name: "",
  });

  // Credentials state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredential, setNewCredential] = useState<NewCredentialForm>(defaultNewCredential);
  const [submittingCredential, setSubmittingCredential] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingDocForId, setUploadingDocForId] = useState<string | null>(null);
  const [expandedCredential, setExpandedCredential] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch("/api/member/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch {
      // silent
    } finally {
      setCredentialsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/member/profile");
        if (res.ok) {
          const data = await res.json();
          const u = data.user || {};
          const dp = data.doctorProfile || {};
          const dm = data.dfcMember || {};
          setProfile({
            title: dp.title || "",
            fullName: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            specialty: dp.specialty?.name || "",
            subSpecialty: dp.subSpecialty || "",
            institution: dp.institution || dm.institution || "",
            city: dp.city || "",
            country: dp.country || "",
            mdcnLicence: dp.mdcnNumber || dm.nigerianLicence || "",
            bio: dp.bio || dm.bio || "",
            whatsappOptIn: dm.whatsappOptIn ?? false,
            profileImage: u.profileImage || "",
          });

          const score = dm.profileCompletionScore ?? 0;
          setProfileScore(score);
          setScoreData({
            score,
            profileImage: !!u.profileImage,
            hasVerifiedCredential: false,
            bio: dp.bio || dm.bio || "",
            phone: u.phone || "",
            specialty: dp.specialty?.name || "",
            institution: dp.institution || dm.institution || "",
            country: dp.country || "",
            name: u.name || "",
          });
        }
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
    fetchCredentials();
  }, [fetchCredentials]);

  useEffect(() => {
    const hasVerified = credentials.some((c) => c.status === "VERIFIED");
    setScoreData((prev) => ({ ...prev, hasVerifiedCredential: hasVerified }));
  }, [credentials]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setProfile((prev) => ({ ...prev, [name]: checked }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "Photo must be less than 5MB." });
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { url } = await uploadRes.json();

      // Save to profile
      const saveRes = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: url }),
      });

      if (saveRes.ok) {
        setProfile((prev) => ({ ...prev, profileImage: url }));
        setScoreData((prev) => ({ ...prev, profileImage: true }));
        setToast({ type: "success", message: "Profile photo updated." });
      }
    } catch {
      setToast({ type: "error", message: "Failed to upload photo. Try again." });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.fullName,
          phone: profile.phone,
          title: profile.title,
          specialty: profile.specialty,
          subSpecialty: profile.subSpecialty,
          institution: profile.institution,
          city: profile.city,
          country: profile.country,
          mdcnNumber: profile.mdcnLicence,
          nigerianLicence: profile.mdcnLicence,
          bio: profile.bio,
          whatsappOptIn: profile.whatsappOptIn,
        }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "Profile updated successfully." });
      } else {
        const data = await res.json().catch(() => null);
        setToast({
          type: "error",
          message: data?.error || "Failed to save changes. Please try again.",
        });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please check your connection." });
    } finally {
      setSaving(false);
    }
  }

  // --- Credential form handlers ---

  function handleCredentialChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setNewCredential((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "type") {
        updated.issuingBody = ISSUING_BODY_MAP[value] || "";
        updated.country = CREDENTIAL_COUNTRY_MAP[value] || "";
      }
      return updated;
    });
  }

  async function handleDocUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    existingCredentialId?: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "File size must be less than 5MB." });
      return;
    }

    if (existingCredentialId) {
      setUploadingDocForId(existingCredentialId);
    } else {
      setUploadingDoc(true);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", { method: "POST", body: formData });

      if (res.ok) {
        const data = await res.json();
        if (existingCredentialId) {
          const patchRes = await fetch("/api/member/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credentialId: existingCredentialId, documentUrl: data.url }),
          });
          if (patchRes.ok) {
            setToast({ type: "success", message: "Document uploaded." });
            fetchCredentials();
          }
        } else {
          setNewCredential((prev) => ({ ...prev, documentUrl: data.url }));
          setToast({ type: "success", message: "Document uploaded." });
        }
      } else {
        setToast({ type: "error", message: "Failed to upload document." });
      }
    } catch {
      setToast({ type: "error", message: "Upload failed. Please try again." });
    } finally {
      setUploadingDoc(false);
      setUploadingDocForId(null);
    }
  }

  async function handleSubmitCredential(e: React.FormEvent) {
    e.preventDefault();

    if (!newCredential.type || !newCredential.registrationNumber) {
      setToast({ type: "error", message: "Type and registration number are required." });
      return;
    }

    setSubmittingCredential(true);
    try {
      const res = await fetch("/api/member/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newCredential.type,
          registrationNumber: newCredential.registrationNumber,
          issuingBody: newCredential.issuingBody,
          country: newCredential.country,
          issueDate: newCredential.issueDate || null,
          expiryDate: newCredential.expiryDate || null,
          documentUrl: newCredential.documentUrl || null,
        }),
      });

      if (res.ok) {
        setToast({ type: "success", message: "Credential submitted for verification." });
        setNewCredential(defaultNewCredential);
        setShowAddForm(false);
        fetchCredentials();
      } else {
        const data = await res.json().catch(() => null);
        setToast({ type: "error", message: data?.error || "Failed to submit credential." });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmittingCredential(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D1F3C]">Professional Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Keep your membership details up to date</p>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  const missingItems = getMissingItems(scoreData);
  const verifiedCount = credentials.filter((c) => c.status === "VERIFIED").length;
  const pendingCount = credentials.filter((c) => c.status === "PENDING").length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Professional Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Keep your membership details up to date</p>
      </div>

      {/* ── Profile Header Card ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="h-20 bg-gradient-to-r from-[#0D1F3C] to-[#0A6E75]" />
        <div className="px-6 pb-5 -mt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0D1F3C] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profile.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold text-[#0D1F3C] truncate">
                {profile.title} {profile.fullName || "Your Name"}
              </h2>
              {profile.specialty && (
                <p className="text-sm text-[#0A6E75] font-medium">
                  {profile.specialty}
                  {profile.subSpecialty ? ` — ${profile.subSpecialty}` : ""}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            </div>

            {/* Credential summary */}
            <div className="flex items-center gap-3 text-xs pb-1">
              {verifiedCount > 0 && (
                <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {verifiedCount} verified
                </span>
              )}
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Completion ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-gray-700">Profile completion</span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getScoreBadgeColor(profileScore)}`}
          >
            {profileScore}% &mdash; {getScoreLabel(profileScore)}
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getScoreBarColor(profileScore)}`}
            style={{ width: `${profileScore}%` }}
          />
        </div>
        {missingItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missingItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full"
              >
                <AlertCircle className="h-3 w-3" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Section Quick Nav (desktop) ── */}
      <div className="hidden sm:flex items-center gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1.5">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-[#0D1F3C] hover:bg-gray-50 rounded-lg transition-colors"
          >
            {s.icon}
            {s.label}
          </a>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Personal Information ── */}
        <SectionCard
          id="personal"
          title="Personal Information"
          subtitle="Your name and contact details"
          icon={<User className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormSelect
              label="Title"
              id="title"
              name="title"
              value={profile.title}
              onChange={handleChange}
              options={TITLE_OPTIONS}
              placeholder="Select title"
            />
            <FormInput
              label="Full name"
              id="fullName"
              name="fullName"
              type="text"
              value={profile.fullName}
              onChange={handleChange}
            />
            <FormInput
              label="Mobile number"
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleChange}
              placeholder="+234..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Contact support to change your email</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Professional Details ── */}
        <SectionCard
          id="professional"
          title="Professional Details"
          subtitle="Your medical specialty and qualifications"
          icon={<Briefcase className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormSelect
              label="Specialty"
              id="specialty"
              name="specialty"
              value={profile.specialty}
              onChange={handleChange}
              options={SPECIALTIES}
              placeholder="Select specialty"
            />
            <FormInput
              label="Sub-specialty"
              id="subSpecialty"
              name="subSpecialty"
              type="text"
              value={profile.subSpecialty}
              onChange={handleChange}
              optional
              placeholder="e.g. Paediatric Cardiology"
            />
            <FormInput
              label="Institution"
              id="institution"
              name="institution"
              type="text"
              value={profile.institution}
              onChange={handleChange}
              placeholder="e.g. King's College Hospital"
            />
            <FormInput
              label="MDCN licence number"
              id="mdcnLicence"
              name="mdcnLicence"
              type="text"
              value={profile.mdcnLicence}
              onChange={handleChange}
              placeholder="e.g. MDCN/R/12345"
            />
          </div>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard
          id="location"
          title="Location & Practice"
          subtitle="Where you're based and practising"
          icon={<MapPin className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="City"
              id="city"
              name="city"
              type="text"
              value={profile.city}
              onChange={handleChange}
              placeholder="e.g. London"
            />
            <FormSelect
              label="Country"
              id="country"
              name="country"
              value={profile.country}
              onChange={handleChange}
              options={COUNTRIES}
              placeholder="Select country"
            />
          </div>
        </SectionCard>

        {/* ── Bio & Preferences ── */}
        <SectionCard
          id="bio"
          title="Bio & Preferences"
          subtitle="Tell colleagues about yourself"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">
                Professional bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={profile.bio}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/40 focus:border-[#0A6E75] transition-colors resize-vertical"
                placeholder="Write a brief summary of your professional background, interests, and areas of expertise..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {profile.bio.length}/500 characters
                {profile.bio.length > 0 && profile.bio.length < 50 && (
                  <span className="text-amber-500 ml-2">Minimum 50 characters recommended</span>
                )}
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <input
                id="whatsappOptIn"
                name="whatsappOptIn"
                type="checkbox"
                checked={profile.whatsappOptIn}
                onChange={handleCheckbox}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0A6E75] focus:ring-[#0A6E75]"
              />
              <div>
                <label htmlFor="whatsappOptIn" className="text-sm font-medium text-gray-700">
                  WhatsApp notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive DFC updates and reminders via WhatsApp
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Save button */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4 sticky bottom-4 shadow-sm">
          <p className="text-xs text-gray-400 hidden sm:block">
            Changes are saved to your member and doctor profiles
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-sm font-medium hover:bg-[#0D1F3C]/90 focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>

      {/* ── Credentials & Verification ── */}
      <SectionCard
        id="credentials"
        title="Credentials & Verification"
        subtitle="Medical registrations and licences verified by DFC"
        icon={<Shield className="h-5 w-5" />}
      >
        {/* Existing credentials */}
        {credentialsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No credentials added yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your medical registrations to verify your membership
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            {credentials.map((cred) => {
              const badge = getStatusBadge(cred.status);
              const isExpanded = expandedCredential === cred.id;

              return (
                <div
                  key={cred.id}
                  className="rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedCredential(isExpanded ? null : cred.id)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      {getStatusIcon(cred.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#0D1F3C]">{cred.type}</span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {cred.registrationNumber} &middot; {cred.issuingBody}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                        <div>
                          <span className="text-gray-400 block mb-0.5">Country</span>
                          <span className="text-gray-700">{cred.country || "—"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block mb-0.5">Added</span>
                          <span className="text-gray-700">
                            {new Date(cred.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {cred.issueDate && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Issued</span>
                            <span className="text-gray-700">
                              {new Date(cred.issueDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {cred.expiryDate && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Expires</span>
                            <span className="text-gray-700">
                              {new Date(cred.expiryDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {cred.status === "VERIFIED" && cred.verifiedAt && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Verified on</span>
                            <span className="text-green-700">
                              {new Date(cred.verifiedAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {cred.status === "REJECTED" && cred.rejectionReason && (
                          <div className="col-span-2">
                            <span className="text-gray-400 block mb-0.5">Rejection reason</span>
                            <span className="text-red-600">{cred.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {cred.documentUrl ? (
                          <a
                            href={cred.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A6E75] hover:text-[#0A6E75]/80 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View document
                          </a>
                        ) : (
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A6E75] hover:text-[#0A6E75]/80 cursor-pointer transition-colors">
                            {uploadingDocForId === cred.id ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 border-2 border-[#0A6E75]/30 border-t-[#0A6E75] rounded-full animate-spin" />
                                Uploading...
                              </span>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5" />
                                Upload document
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              disabled={uploadingDocForId === cred.id}
                              onChange={(e) => handleDocUpload(e, cred.id)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add credential */}
        {!showAddForm ? (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-[#0A6E75]/40 hover:text-[#0A6E75] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add credential
          </button>
        ) : (
          <form
            onSubmit={handleSubmitCredential}
            className="rounded-lg border border-[#0A6E75]/20 bg-[#0A6E75]/[0.02] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0D1F3C]">New Credential</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCredential(defaultNewCredential);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cred-type" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Credential type
                </label>
                <select
                  id="cred-type"
                  name="type"
                  value={newCredential.type}
                  onChange={handleCredentialChange}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A6E75]/40 focus:border-[#0A6E75]"
                >
                  <option value="">Select type</option>
                  {CREDENTIAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Registration number"
                id="cred-regnum"
                name="registrationNumber"
                type="text"
                value={newCredential.registrationNumber}
                onChange={handleCredentialChange}
                placeholder="e.g. MDCN/R/12345"
              />

              <FormInput
                label="Issuing body"
                id="cred-issuer"
                name="issuingBody"
                type="text"
                value={newCredential.issuingBody}
                onChange={handleCredentialChange}
              />

              <FormInput
                label="Country"
                id="cred-country"
                name="country"
                type="text"
                value={newCredential.country}
                onChange={handleCredentialChange}
              />

              <FormInput
                label="Issue date"
                id="cred-issue"
                name="issueDate"
                type="date"
                value={newCredential.issueDate}
                onChange={handleCredentialChange}
                optional
              />

              <FormInput
                label="Expiry date"
                id="cred-expiry"
                name="expiryDate"
                type="date"
                value={newCredential.expiryDate}
                onChange={handleCredentialChange}
                optional
              />
            </div>

            {/* Document upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Supporting document <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {newCredential.documentUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Document uploaded</span>
                  <button
                    type="button"
                    onClick={() => setNewCredential((prev) => ({ ...prev, documentUrl: "" }))}
                    className="text-xs text-red-500 hover:underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-[#0A6E75] hover:text-[#0A6E75]/80 border border-gray-300 rounded-lg px-3.5 py-2.5 transition-colors">
                  {uploadingDoc ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#0A6E75]/30 border-t-[#0A6E75] rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose file (max 5MB)
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploadingDoc}
                    onChange={(e) => handleDocUpload(e)}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submittingCredential || uploadingDoc}
                className="px-5 py-2.5 rounded-lg bg-[#0D1F3C] text-white text-sm font-medium hover:bg-[#0D1F3C]/90 focus:outline-none focus:ring-2 focus:ring-[#0A6E75] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingCredential ? "Submitting..." : "Submit credential"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCredential(defaultNewCredential);
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
