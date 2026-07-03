"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function LoginPageContent() {
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
              className="h-30 w-auto brightness-0 invert"
            />
          </Link>
        </div>
        <LoginForm />
        <p className="text-white/50 text-xs text-center py-3 font-medium">
          &copy; {new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F3C]">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
