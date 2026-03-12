"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Video,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  ArrowRight,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const { addToast } = useToast();

  // Claim account state
  const [claimPassword, setClaimPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference || hasVerified.current) return;
      hasVerified.current = true;

      try {
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setMeetingLink(data.meetingLink);
          if (data.isGuest) {
            setIsGuest(true);
            setGuestEmail(data.guestEmail || null);
          }
        } else {
          console.error("Payment verification failed:", data);
          setErrorMessage(data.error || "Payment verification failed");
          setStatus("error");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setErrorMessage(error.message || "An error occurred");
        setStatus("error");
      }
    };

    if (reference) {
      verifyPayment();
    } else {
      setStatus("error");
    }
  }, [reference]);

  const handleClaimAccount = async () => {
    if (!guestEmail || !claimPassword) return;

    if (claimPassword !== confirmPassword) {
      setClaimError("Passwords do not match");
      return;
    }

    if (claimPassword.length < 8) {
      setClaimError("Password must be at least 8 characters");
      return;
    }

    setClaimLoading(true);
    setClaimError(null);

    try {
      const response = await fetch("/api/auth/claim-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: guestEmail, password: claimPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClaimed(true);
        await refreshUser();
        addToast({
          title: "Account Created",
          description: "You can now sign in and manage your appointments.",
          type: "success",
        });
      } else {
        setClaimError(data.error || "Failed to create account");
      }
    } catch (err: any) {
      setClaimError(err.message || "An error occurred");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!meetingLink) return;
    const fullLink = `${window.location.origin}${meetingLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#0A6E75]/10 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-8 h-8 text-[#0A6E75] animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[#0D1F3C]">Verifying Payment</h2>
          <p className="text-gray-500 mt-1">Please do not close this window.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-2">
            We couldn&apos;t verify your payment. Please try again.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6">{errorMessage}</p>
          )}
          <div className="space-y-3">
            <Button
              className="w-full bg-[#0D1F3C] hover:bg-[#162d52]"
              onClick={() => {
                hasVerified.current = false;
                setStatus("loading");
                setErrorMessage("");
                window.location.reload();
              }}
            >
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/book")}>
              Back to Doctors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-20">
      <div className="max-w-lg w-full space-y-5">
        {/* Main confirmation card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-r from-[#0D1F3C] to-[#0A3454] px-6 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Booking Confirmed</h2>
            <p className="text-white/60 mt-1">
              Your appointment has been scheduled
              {isGuest && guestEmail && (
                <span className="block text-sm mt-1">Confirmation sent to {guestEmail}</span>
              )}
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Meeting link */}
            {meetingLink && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#0D1F3C] flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#0A6E75]" />
                    Consultation Link
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs text-[#0A6E75] hover:text-[#085459] font-medium flex items-center gap-1 transition-colors"
                  >
                    {copied ? (
                      <><Check className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 break-all font-mono bg-white p-3 rounded-lg border border-gray-200 select-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  {meetingLink}
                </p>
              </div>
            )}

            {/* Next steps */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What&apos;s next</p>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-[#0A6E75] mt-0.5 shrink-0" />
                <span>You&apos;ll receive appointment reminders via email before your session.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Video className="w-4 h-4 text-[#0A6E75] mt-0.5 shrink-0" />
                <span>Join the consultation room from the link above at your scheduled time.</span>
              </div>
              {isGuest && !claimed && !user && (
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-[#0A6E75] mt-0.5 shrink-0" />
                  <span>Create a password below to manage your bookings and access your room.</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              {(user || claimed) && (
                <>
                  <Button
                    className="w-full bg-[#0A6E75] hover:bg-[#085c62]"
                    onClick={() => router.push("/appointments")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    My Appointments
                  </Button>
                  {meetingLink && (
                    <Button variant="outline" className="w-full" onClick={() => router.push(meetingLink)}>
                      <Video className="w-4 h-4 mr-2" />
                      Join Consultation Room
                    </Button>
                  )}
                </>
              )}
              {!user && !claimed && (
                <Button variant="outline" className="w-full" onClick={() => router.push("/book")}>
                  Back to Specialists
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Guest account claim — inline, not a separate card */}
        {isGuest && !claimed && !user && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#0A6E75]/20 overflow-hidden">
            <div className="px-6 py-4 bg-[#0A6E75]/5 border-b border-[#0A6E75]/10">
              <h3 className="font-bold text-[#0D1F3C] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0A6E75]" />
                Activate Your Account
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Set a password to manage appointments and access your consultation room.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base"
                />
              </div>
              {claimError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{claimError}</p>
              )}
              <Button
                className="w-full bg-[#0A6E75] hover:bg-[#085459] py-3"
                onClick={handleClaimAccount}
                disabled={claimLoading || !claimPassword || !confirmPassword}
              >
                {claimLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Activate Account
              </Button>
              <p className="text-xs text-gray-400 text-center">
                You can always do this later from the sign-in page
              </p>
            </div>
          </div>
        )}

        {/* Claimed success */}
        {claimed && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-emerald-800">Account activated — you&apos;re signed in.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <>
      <Topbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#0A6E75] animate-spin" />
          </div>
        }
      >
        <PaymentCallbackContent />
      </Suspense>
      <Footer />
    </>
  );
}
