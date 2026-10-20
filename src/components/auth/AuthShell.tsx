import Image from "next/image";
import Link from "next/link";

/**
 * Backdrop shared by the sign-in, forgot-password and account-activation
 * pages, so every auth form sits on the same gradient with the same logo.
 * Put an AuthCard (or LoginForm) inside.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
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
        {children}
        <p className="text-white/50 text-xs text-center py-3 font-medium">
          &copy; {new Date().getFullYear()} Doctors Foundation for Care. All rights reserved.
        </p>
      </div>
    </div>
  );
}

/** The card style the sign-in form uses; other auth forms match it. */
export const authCardClass =
  "w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border-white/60 shadow-2xl rounded-2xl";
