"use client";

import { Users, Building2, HeartPulse, CalendarCheck } from "lucide-react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { useCountUp } from "@/lib/useCountUp";

export default function ImpactStats() {
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  const doctorsCount = useCountUp({
    end: 150,
    isVisible: statsVisible,
    duration: 2500,
  });
  const hospitalsCount = useCountUp({
    end: 50,
    isVisible: statsVisible,
    duration: 2000,
  });
  const patientsCount = useCountUp({
    end: 10000,
    isVisible: statsVisible,
    duration: 3000,
  });

  return (
    <section className="bg-white dark:bg-surface-dark dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={statsRef}
          className={`mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-up ${statsVisible ? "visible" : ""}`}
        >
          <div className="transition-all duration-500 hover:scale-105">
            <p className="text-3xl font-bold text-primary dark:text-white">
              {doctorsCount}+
            </p>
            <p className="text-primary text-sm font-medium ">
              Diaspora Doctors
            </p>
          </div>

          <div className="transition-all duration-500 hover:scale-105">
            <p className="text-3xl font-bold text-[#FA9F42] dark:text-white">
              {hospitalsCount}+
            </p>
            <p className="text-[#FA9F42] text-sm font-medium">
              Partner Hospitals
            </p>
          </div>

          <div className="transition-all duration-500 hover:scale-105">
            <p className="text-3xl font-bold text-[#832232]">
              {patientsCount.toLocaleString()}+
            </p>
            <p className="text-[#832232] text-sm font-medium">
              Cases Handled
            </p>
          </div>

          <div className="transition-all duration-500 hover:scale-105">
            <p className="text-3xl font-bold text-[#0F7709] dark:text-white">
              98%
            </p>
            <p className="text-[#0F7709] text-sm font-medium">Success Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
