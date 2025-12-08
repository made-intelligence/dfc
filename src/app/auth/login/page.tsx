"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import Image from "next/image";
import Link from "next/link";

function LoginPageContent() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div
          ref={headerRef}
          className={`flex justify-center animate-fade-up ${headerVisible ? "visible" : ""}`}
        >
          <Link href="/">
          <Image
            src="/logo.png"
            alt="Doctors Foundation for Care logo"
            width={160}
            height={60}
            className="h-30 w-auto"
          />
          </Link>
        </div>
        <LoginForm />
         <p className="text-primary text-xs text-center py-3 font-medium">
            &copy; {new Date().getFullYear()} Doctors Foundation for Care. All
            rights reserved.
          </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
