"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell, authCardClass } from "@/components/auth/AuthShell";

/**
 * Emails a new password. The current one keeps working until the new one is
 * used to sign in, so a stray request can't lock anyone out.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send a new password");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a new password");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthShell>
      <Card className={authCardClass}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and we&apos;ll send you a new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex items-start gap-2 rounded-md bg-primary/5 p-3 text-sm text-gray-700">
              <MailCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>
                If an account exists for <strong>{email.trim().toLowerCase()}</strong>, a new password is
                on its way. Use it to sign in; it then becomes your password.
              </span>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={sending}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Email Me a New Password"
                )}
              </Button>
            </form>
          )}

          <div className="flex justify-center pt-4">
            <p className="text-sm text-primary font-medium">
              <Link href="/auth/login" className="hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
