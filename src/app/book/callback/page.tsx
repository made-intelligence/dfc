"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Calendar, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Suspense } from "react";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  // ... (rest of the component logic)
  const reference = searchParams.get("reference");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Use a ref to ensure verify only runs once (React 18 strict mode double-invokes effects)
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference || hasVerified.current) return;
      hasVerified.current = true;

      try {
        console.log('Verifying payment with reference:', reference);
        const response = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();
        console.log('Verification response:', { status: response.status, data });

        if (response.ok && data.success) {
          setStatus("success");
          setMeetingLink(data.meetingLink);
        } else {
          console.error('Payment verification failed:', data);
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#0A2463] mb-4 mx-auto animate-spin" />
            <h2 className="text-xl font-semibold">Verifying Payment...</h2>
            <p className="text-gray-500">Please do not close this window.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {status === "success" ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "success" ? "Booking Confirmed!" : "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "success" ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your payment was successful and your appointment has been scheduled.
              </p>
              
              {meetingLink && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="font-semibold text-[#0A2463] mb-2 flex items-center justify-center gap-2">
                          <Video className="w-4 h-4" />
                          Virtual Consultation Link
                      </p>
                      <p className="text-sm text-blue-700 break-all select-all font-mono bg-white p-2 rounded border">
                          {window.location.origin}{meetingLink}
                      </p>
                  </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                We couldn't verify your payment. Please try again.
              </p>
              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {errorMessage}
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {status === "success" ? (
            <>
                <Button className="w-full" onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                </Button>
                 {meetingLink && (
                    <Button variant="outline" className="w-full" onClick={() => router.push(meetingLink)}>
                        Join Room Now (Test)
                    </Button>
                )}
            </>
          ) : (
            <>
              <Button 
                className="w-full" 
                onClick={() => {
                  hasVerified.current = false;
                  setStatus("loading");
                  setErrorMessage("");
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/book')}
              >
                Back to Doctors
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#0A2463] animate-spin" />
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    );
}
