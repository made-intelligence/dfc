"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F3C]">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    }>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </Suspense>
  );
}
