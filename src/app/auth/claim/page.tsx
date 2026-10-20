"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "@/lib/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { getDashboardUrl, getDashboardLabel } from "@/lib/dashboard-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell, authCardClass } from "@/components/auth/AuthShell";

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"validating" | "ready" | "invalid" | "submitting" | "done">(
    "validating",
  );
  const [member, setMember] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [destination, setDestination] = useState<{ href: string; label: string } | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("This claim link is missing its token. Please use the link from your invitation email.");
      return;
    }
    let active = true;
    fetch(`/api/auth/claim?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          setMember({ name: data.name, email: data.email });
          setStatus("ready");
        } else {
          setError(data.error || "This claim link is invalid or has already been used.");
          setStatus("invalid");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Something went wrong. Please try again.");
        setStatus("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(
        data.message ||
          "If that address belongs to an account awaiting activation, a new link is on its way.",
      );
    } catch {
      setResendMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        // The claim response signs the member in and carries their role, so
        // send them to the portal they actually have access to.
        const href = getDashboardUrl(data.user?.role);
        setDestination({ href, label: getDashboardLabel(data.user?.role) });
        setTimeout(() => router.push(href), 2500);
      } else {
        setError(data.error || "Could not activate your account. Please try again.");
        setStatus("ready");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("ready");
    }
  }

  const submitting = status === "submitting";

  return (
    <AuthShell>
      <Card className={authCardClass}>
        {status === "validating" && (
          <CardContent className="text-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Checking your invitation…</p>
          </CardContent>
        )}

        {status === "invalid" && (
          <>
            <CardHeader className="space-y-1">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
                Link Not Valid
              </CardTitle>
              <CardDescription className="text-center">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Activation links expire after 30 days. Let members re-issue
                  one themselves instead of writing to the secretariat. */}
              {resendMessage ? (
                <div className="text-sm text-emerald-800 bg-emerald-50 p-3 rounded-md">
                  {resendMessage}
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendEmail">Send me a new link</Label>
                    <Input
                      id="resendEmail"
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Email your invitation was sent to"
                      disabled={resending}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resending}>
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Email Me a New Link"
                    )}
                  </Button>
                </form>
              )}

              <div className="flex justify-center pt-4">
                <p className="text-sm text-primary font-medium">
                  <Link href="/auth/login" className="hover:underline">
                    Go to Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </>
        )}

        {status === "done" && (
          <>
            <CardHeader className="space-y-1">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
                You&rsquo;re All Set
              </CardTitle>
              <CardDescription className="text-center">
                {member?.name ? `Welcome to DFC, ${member.name.split(" ")[0]}. ` : "Welcome to DFC. "}
                Your account is active and you are signed in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in from now on with{" "}
                <span className="font-medium text-gray-700">{member?.email}</span>{" "}
                and the password you just set.
              </p>
              {/* An explicit way through, so nobody is stranded if the
                  automatic redirect does not fire. */}
              <Button className="w-full" onClick={() => router.push(destination?.href ?? "/")}>
                Go to my {destination?.label ?? "dashboard"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Taking you there automatically…
              </p>
            </CardContent>
          </>
        )}

        {(status === "ready" || submitting) && member && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
                Welcome to DFC
              </CardTitle>
              <CardDescription className="text-center">
                {member.name}, set a password to activate your account
                <span className="block mt-1">{member.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      disabled={submitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={submitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use upper and lower case letters and at least one number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    "Activate My Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </AuthShell>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0D1F3C]">
          <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
