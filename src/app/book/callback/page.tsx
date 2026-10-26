"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "@/lib/navigation";
import {
  CheckCircle,
  XCircle,
  Video,
  Loader2,
  Calendar,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    reference ? "loading" : "error"
  );
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(
    reference ? "" : "No payment reference was found."
  );

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
        } else {
          console.error("Payment verification failed:", data);
          setErrorMessage(data.error || "Payment verification failed");
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setErrorMessage(error instanceof Error ? error.message : "An error occurred");
        setStatus("error");
      }
    };

    verifyPayment();
  }, [reference]);

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
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              {user && (
                <>
                  <Button
                    className="w-full bg-[#0A6E75] hover:bg-[#085c62]"
                    onClick={() => router.push("/appointments")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    My Appointments
                  </Button>
                  {meetingLink && (
                    <Button variant="outline" className="w-full" onClick={() => window.location.assign(meetingLink)}>
                      <Video className="w-4 h-4 mr-2" />
                      Join Consultation Room
                    </Button>
                  )}
                </>
              )}
              {!user && (
                <Button variant="outline" className="w-full" onClick={() => router.push("/book")}>
                  Back to Specialists
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

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
