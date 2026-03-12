"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function LoginPageContent() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#0A6E75]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0D1F3C]/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

      {/* Cross pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

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
