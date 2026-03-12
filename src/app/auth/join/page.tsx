import { JoinDFCForm } from '@/components/join/JoinDFCForm';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Join DFC — Doctors Foundation for Care' };

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-[#0D1F3C]">
      {/* Top bar with logo */}
      <div className="bg-[#0D1F3C] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/dfc-logo.png"
              alt="DFC"
              width={120}
              height={44}
              className="w-auto h-9"
            />
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Already a member? Sign in
          </Link>
        </div>
      </div>

      {/* Hero strip */}
      <div className="bg-[#0D1F3C] py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Join the movement
          </h1>
          <p className="mt-2 text-base text-white/60 max-w-lg mx-auto">
            Apply for DFC membership and help turn brain drain into brain gain.
          </p>
        </div>
      </div>

      {/* Form container */}
      <div className="bg-gray-50 rounded-t-3xl min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <JoinDFCForm />
        </div>
      </div>
    </main>
  );
}
