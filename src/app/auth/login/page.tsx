"use client";

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useScrollAnimation } from '@/lib/useScrollAnimation';

function LoginPageContent() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div ref={headerRef} className={`text-center mb-8 animate-fade-up ${headerVisible ? 'visible' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>
        <LoginForm />

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
