"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  ArrowLeft,
  MapPin,
  Building2,
  Stethoscope,
  ShieldCheck,
  Users,
  Award,
  Clock,
  FileCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

interface Credential {
  id: string;
  type: string;
  registrationNumber: string;
  issuingBody: string;
  country: string;
  specialty?: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

interface Endorsement {
  id: string;
  endorserName: string;
  endorserId: string;
  relationshipType: string;
  statement: string;
  yearsKnown: number | null;
  createdAt: string;
}

interface Specialist {
  id: string;
  slug: string;
  name: string;
  title?: string;
  profileImage?: string;
  specialty: string;
  subSpecialty?: string;
  institution: string;
  city: string;
  country?: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  endorsementCount: number;
  bio?: string;
  mdcnNumber?: string;
  userId: string;
  category?: string;
  profileCompletionScore: number;
  lastVerifiedAt: string | null;
  credentials: Credential[];
  endorsements: Endorsement[];
}

const RELATIONSHIP_TYPES = [
  "Colleague",
  "Supervisor",
  "Collaborator",
  "Training",
  "Research",
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SpecialistProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEndorseModal, setShowEndorseModal] = useState(false);

  const [relationshipType, setRelationshipType] = useState(RELATIONSHIP_TYPES[0]);
  const [yearsKnown, setYearsKnown] = useState<string>("");
  const [statement, setStatement] = useState("");
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [endorseResult, setEndorseResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadSpecialist = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/public/specialists?slug=${encodeURIComponent(slug)}`
      );
      if (res.ok) {
        const data = await res.json();
        const list: Specialist[] = data.specialists ?? data ?? [];
        setSpecialist(list[0] ?? null);
      }
    } catch {
      console.error("Failed to fetch specialist");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSpecialist();
  }, [loadSpecialist]);

  async function handleEndorse() {
    if (!specialist || statement.length < 80 || statement.length > 500 || !attested) return;
    setSubmitting(true);
    setEndorseResult(null);
    try {
      const res = await fetch("/api/member/endorse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistUserId: specialist.userId,
          relationshipType,
          yearsKnown: yearsKnown ? parseInt(yearsKnown, 10) : null,
          statement,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const nowVerified = data.specialistNowVerified;
        setEndorseResult({
          type: "success",
          message: nowVerified
            ? "Endorsement submitted. This specialist is now DFC Verified."
            : "Endorsement submitted successfully. Thank you for your peer review.",
        });
        setShowEndorseModal(false);
        setStatement("");
        setYearsKnown("");
        setAttested(false);
        setRelationshipType(RELATIONSHIP_TYPES[0]);
        // Reload specialist data to reflect new endorsement
        loadSpecialist();
      } else {
        const err = await res.json().catch(() => null);
        setEndorseResult({
          type: "error",
          message: err?.error ?? "Failed to submit endorsement.",
        });
      }
    } catch {
      setEndorseResult({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isVerified = specialist?.status === "ACTIVE";
  const hasVerifiedCredential = (specialist?.credentials?.length ?? 0) > 0;
  const endorsementCount = specialist?.endorsementCount ?? 0;
  const peerChecked = endorsementCount >= 2;
  const isDfcVerified =
    isVerified && hasVerifiedCredential && peerChecked;
  const profileComplete =
    (specialist?.profileCompletionScore ?? 0) >= 70;

  // Get the earliest credential submission date
  const firstCredentialDate = specialist?.credentials?.[0]?.createdAt;
  const firstVerifiedDate = specialist?.credentials?.find(
    (c) => c.verifiedAt
  )?.verifiedAt;

  // Determine if current user can endorse
  const canEndorse =
    user &&
    user.role === "DFC_MEMBER" &&
    specialist &&
    user.id !== specialist.userId &&
    !specialist.endorsements?.some((e) => e.endorserId === user.dfcMember?.id);

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero header */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0D1F3C 0%, #122847 40%, #0A4A50 100%)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-3xl"
              style={{ top: "-15%", right: "5%" }}
            />
            <div
              className="absolute w-[200px] h-[200px] rounded-full bg-[#0A4A50]/20 blur-2xl"
              style={{ bottom: "-10%", left: "15%" }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-28 pb-12 lg:pt-32 lg:pb-16">
            <Link
              href="/specialists"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Specialist Network
            </Link>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/10 rounded w-2/3 mb-3" />
                <div className="h-5 bg-white/10 rounded w-1/3" />
              </div>
            ) : specialist ? (
              <div className="flex items-start gap-5">
                {/* Avatar initial */}
                <div className="hidden sm:flex w-16 h-16 rounded-full bg-white/10 border border-white/20 items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold font-serif">
                    {specialist.name.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  {/* Name + badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                      {specialist.title ? `${specialist.title} ` : ""}
                      {specialist.name}
                    </h1>

                    {isDfcVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/20 border border-green-400/30 px-3 py-1 text-xs font-semibold text-green-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        DFC Verified
                      </span>
                    ) : profileComplete ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-400/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-300">
                        <Award className="w-3.5 h-3.5" />
                        Profile Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-medium text-amber-300">
                        Pending Verification
                      </span>
                    )}
                  </div>

                  {/* Specialty and details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4" />
                      {specialist.specialty}
                      {specialist.subSpecialty
                        ? ` — ${specialist.subSpecialty}`
                        : ""}
                    </span>
                    {specialist.institution && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {specialist.institution}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {specialist.city}
                      {specialist.country ? `, ${specialist.country}` : ""}
                    </span>
                  </div>

                  {/* Last verified date */}
                  {specialist.lastVerifiedAt && (
                    <p className="text-xs text-white/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Last verified: {formatDate(specialist.lastVerifiedAt)}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Content body */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
          {loading && (
            <div className="animate-pulse space-y-6">
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          )}

          {!loading && !specialist && (
            <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
              <p className="text-base font-medium text-gray-900 mb-1">
                Specialist not found
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This specialist may have been removed or the link is invalid.
              </p>
              <Link
                href="/specialists"
                className="text-sm font-medium text-[#0A4A50] hover:underline"
              >
                Browse all specialists
              </Link>
            </div>
          )}

          {!loading && specialist && (
            <div className="space-y-6">
              {/* Endorsement result banner */}
              {endorseResult && (
                <div
                  className={`rounded-xl border px-5 py-4 text-sm ${
                    endorseResult.type === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {endorseResult.message}
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main content — left 2/3 */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio */}
                  {specialist.bio && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h2 className="text-lg font-semibold text-[#0D1F3C] mb-3 font-serif">
                        Professional Background
                      </h2>
                      <p className="text-base leading-relaxed text-gray-700">
                        {specialist.bio}
                      </p>
                    </div>
                  )}

                  {/* Verified credentials */}
                  {specialist.credentials &&
                    specialist.credentials.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-[#0D1F3C] mb-4 font-serif flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-[#0A4A50]" />
                          Verified Credentials
                        </h2>
                        <div className="space-y-3">
                          {specialist.credentials.map((cred) => (
                            <div
                              key={cred.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100"
                            >
                              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {cred.type}: {cred.registrationNumber}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {cred.issuingBody} ({cred.country})
                                  {cred.verifiedAt &&
                                    ` — Verified by DFC Secretariat on ${formatDate(
                                      cred.verifiedAt
                                    )}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Verification audit trail */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#0D1F3C] mb-5 font-serif">
                      Verification Audit Trail
                    </h2>
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

                      <div className="space-y-5">
                        {/* Step 1: Licence submitted */}
                        {(() => {
                          const done = hasVerifiedCredential || !!firstCredentialDate;
                          return (
                            <div className="relative flex items-start gap-4 pl-0">
                              <div className="relative z-10 shrink-0">
                                {done ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    done ? "text-gray-900" : "text-gray-400"
                                  }`}
                                >
                                  Licence submitted
                                </p>
                                {firstCredentialDate && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {formatDate(firstCredentialDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Step 2: Credential verified */}
                        {(() => {
                          const done = hasVerifiedCredential;
                          return (
                            <div className="relative flex items-start gap-4 pl-0">
                              <div className="relative z-10 shrink-0">
                                {done ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    done ? "text-gray-900" : "text-gray-400"
                                  }`}
                                >
                                  Credential verified
                                </p>
                                {firstVerifiedDate && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {formatDate(firstVerifiedDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Step 3: Peer endorsements */}
                        {(() => {
                          const done = peerChecked;
                          return (
                            <div className="relative flex items-start gap-4 pl-0">
                              <div className="relative z-10 shrink-0">
                                {done ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    done ? "text-gray-900" : "text-gray-400"
                                  }`}
                                >
                                  Peer endorsements
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {endorsementCount}/2 received
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Step 4: Secretariat approval */}
                        {(() => {
                          const done = isVerified;
                          return (
                            <div className="relative flex items-start gap-4 pl-0">
                              <div className="relative z-10 shrink-0">
                                {done ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    done ? "text-gray-900" : "text-gray-400"
                                  }`}
                                >
                                  Secretariat approval
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {done
                                    ? "Approved"
                                    : specialist.status === "PENDING"
                                    ? "Pending"
                                    : specialist.status === "SUSPENDED"
                                    ? "Under review"
                                    : specialist.status}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Endorsements section — visible to logged-in DFC_MEMBER */}
                  {user?.role === "DFC_MEMBER" && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#0D1F3C] font-serif flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#0A4A50]" />
                          Peer Endorsements
                        </h2>
                        {canEndorse && (
                          <button
                            onClick={() => setShowEndorseModal(true)}
                            className="rounded-lg bg-[#0D1F3C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162a4a] transition-colors"
                          >
                            Endorse this specialist
                          </button>
                        )}
                      </div>

                      {specialist.endorsements &&
                      specialist.endorsements.length > 0 ? (
                        <div className="space-y-4">
                          {specialist.endorsements.map((endorsement) => (
                            <div
                              key={endorsement.id}
                              className="p-4 rounded-lg border border-gray-100 bg-gray-50/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {endorsement.endorserName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {endorsement.relationshipType}
                                    {endorsement.yearsKnown
                                      ? ` · ${endorsement.yearsKnown} year${
                                          endorsement.yearsKnown !== 1
                                            ? "s"
                                            : ""
                                        } known`
                                      : ""}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {formatDate(endorsement.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                &ldquo;
                                {endorsement.statement.length > 180
                                  ? endorsement.statement.slice(0, 180) + "..."
                                  : endorsement.statement}
                                &rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          No endorsements yet. Be the first to endorse this
                          specialist.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Sidebar — right 1/3 */}
                <div className="space-y-6">
                  {/* Professional details card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-[#0D1F3C] mb-4 font-serif">
                      Professional Details
                    </h2>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Specialty
                        </dt>
                        <dd className="text-sm text-gray-900 mt-0.5">
                          {specialist.specialty}
                          {specialist.subSpecialty
                            ? ` — ${specialist.subSpecialty}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Institution
                        </dt>
                        <dd className="text-sm text-gray-900 mt-0.5">
                          {specialist.institution || "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Location
                        </dt>
                        <dd className="text-sm text-gray-900 mt-0.5">
                          {specialist.city}
                          {specialist.country
                            ? `, ${specialist.country}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Endorsements
                        </dt>
                        <dd className="text-sm text-gray-900 mt-0.5 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#0A4A50]" />
                          {endorsementCount} peer endorsement
                          {endorsementCount !== 1 ? "s" : ""}
                        </dd>
                      </div>
                      {specialist.profileCompletionScore > 0 && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Profile Score
                          </dt>
                          <dd className="mt-1">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${specialist.profileCompletionScore}%`,
                                  backgroundColor:
                                    specialist.profileCompletionScore >= 70
                                      ? "#0A4A50"
                                      : "#d97706",
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {specialist.profileCompletionScore}% complete
                            </p>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Endorse CTA (sidebar) — visible when user can endorse */}
                  {canEndorse && (
                    <div className="bg-[#0D1F3C] rounded-xl p-6 text-white">
                      <h3 className="text-base font-semibold mb-2 font-serif">
                        Know this specialist?
                      </h3>
                      <p className="text-sm text-white/70 mb-4">
                        Help verify their credentials with a peer endorsement.
                        Two endorsements are required for full verification.
                      </p>
                      <button
                        onClick={() => setShowEndorseModal(true)}
                        className="w-full rounded-lg bg-white text-[#0D1F3C] px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Endorse this specialist
                      </button>
                    </div>
                  )}

                  {/* Second opinion CTA */}
                  <div className="bg-[#0A4A50] rounded-xl p-6 text-white">
                    <h3 className="text-base font-semibold mb-2 font-serif">
                      Need a second opinion from a DFC specialist?
                    </h3>
                    <p className="text-sm text-white/70 mb-4">
                      Get a written clinical assessment from a DFC-verified
                      specialist.
                    </p>
                    <Link
                      href="/second-opinion"
                      className="block w-full text-center rounded-lg bg-white text-[#0A4A50] px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Request second opinion
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Endorsement modal */}
        {showEndorseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl relative">
              {/* Close button */}
              <button
                onClick={() => setShowEndorseModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold text-[#0D1F3C] mb-1 font-serif">
                Endorse Specialist
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Your endorsement helps verify{" "}
                {specialist?.title ? `${specialist.title} ` : ""}
                {specialist?.name}&apos;s credentials within the DFC network.
              </p>

              {/* Relationship type */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Relationship type
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                >
                  {RELATIONSHIP_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Years known */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Years known
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsKnown}
                  onChange={(e) => setYearsKnown(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                />
              </div>

              {/* Statement */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Endorsement statement
                </label>
                <textarea
                  value={statement}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setStatement(e.target.value);
                    }
                  }}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-[#0A4A50]"
                  placeholder="Describe your professional relationship and why you endorse this specialist..."
                />
                <div className="flex justify-between mt-1">
                  <p
                    className={`text-xs ${
                      statement.length >= 80
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {statement.length < 80
                      ? `${80 - statement.length} more characters needed`
                      : "Minimum reached"}
                  </p>
                  <p
                    className={`text-xs ${
                      statement.length > 480
                        ? "text-amber-600"
                        : "text-gray-400"
                    }`}
                  >
                    {statement.length}/500
                  </p>
                </div>
              </div>

              {/* Attestation */}
              <div className="mb-6">
                <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attested}
                    onChange={(e) => setAttested(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#0A4A50] focus:ring-[#0A4A50]"
                  />
                  <span>
                    I confirm this is a genuine professional endorsement based on
                    my direct knowledge of this physician&apos;s clinical practice
                    and character.
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndorseModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndorse}
                  disabled={
                    statement.length < 80 || !attested || submitting
                  }
                  className="flex-1 rounded-lg bg-[#0D1F3C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162a4a] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit endorsement"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
