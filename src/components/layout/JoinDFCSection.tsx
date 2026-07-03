"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function JoinDFCSection() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2">
      {/* Left panel — Membership */}
      <div className="relative bg-[#0D1F3C] text-white px-6 sm:px-12 py-16 sm:py-20 flex flex-col justify-center overflow-hidden">
        <div className="relative z-10 max-w-md mx-auto md:mx-0">
          <span className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-3 block">
            For physicians
          </span>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            Apply for DFC membership
          </h2>
          <p className="mt-4 text-base text-gray-300 leading-relaxed">
            Open to licensed physicians with specialist training abroad,
            Nigeria-based consultants, and physicians in training. Annual dues
            apply.
          </p>
          <Link
            href="/auth/join"
            className="mt-8 inline-flex items-center gap-2 bg-white text-[#0D1F3C] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-gray-100 transition-colors"
          >
            Apply now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Right panel — Second Opinion */}
      <div className="relative bg-[#0A4A50] text-white px-6 sm:px-12 py-16 sm:py-20 flex flex-col justify-center overflow-hidden">
        <div className="relative z-10 max-w-md mx-auto md:mx-0">
          <span className="text-xs font-semibold tracking-wider text-white/40 uppercase mb-3 block">
            For patients
          </span>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            Need a second opinion?
          </h2>
          <p className="mt-4 text-base text-gray-200 leading-relaxed">
            Before any major procedure or big diagnosis, get a review from one of
            our diaspora-trained specialists. Remote review, written report,
            72-hour turnaround.
          </p>
          <Link
            href="/second-opinion"
            className="mt-8 inline-flex items-center gap-2 bg-white text-[#0A4A50] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-gray-100 transition-colors"
          >
            Request a second opinion
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
