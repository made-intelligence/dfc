"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

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
        setTimeout(() => router.push("/dashboard"), 1600);
      } else {
        setError(data.error || "Could not activate your account. Please try again.");
        setStatus("ready");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("ready");
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Doctors Foundation for Care logo"
              width={160}
              height={60}
              className="h-20 w-auto brightness-0 invert"
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === "validating" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-[#0A6E75] animate-spin mx-auto" />
              <p className="mt-4 text-gray-500">Checking your invitation…</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h1 className="mt-4 text-xl font-bold text-[#0D1F3C]">Link not valid</h1>
              <p className="mt-2 text-gray-600">{error}</p>
              <Link
                href="/auth/login"
                className="mt-6 inline-block text-[#0A6E75] font-medium hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {status === "done" && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h1 className="mt-4 text-xl font-bold text-[#0D1F3C]">Account activated</h1>
              <p className="mt-2 text-gray-600">Signing you in…</p>
            </div>
          )}

          {(status === "ready" || status === "submitting") && member && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#0D1F3C]">Welcome to DFC</h1>
                <p className="mt-2 text-gray-600">
                  {member.name}, set a password to activate your account.
                </p>
                <p className="mt-1 text-sm text-gray-400">{member.email}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Create password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 text-base text-gray-900 focus:border-[#0A6E75] focus:ring-1 focus:ring-[#0A6E75] outline-none"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Use upper and lower case letters and at least one number.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-[#0A6E75] focus:ring-1 focus:ring-[#0A6E75] outline-none"
                    placeholder="Re-enter your password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-[#0A6E75] text-white font-semibold rounded-lg py-3 min-h-[44px] hover:bg-[#0D1F3C] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {status === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Activate my account
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-white/50 text-xs text-center py-4 font-medium">
          &copy; {new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.
        </p>
      </div>
    </div>
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
