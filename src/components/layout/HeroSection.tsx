"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const INTERVAL = 6000;

const slides = [
  {
    id: 1,
    image: "/hero.jpg",
    badge: "For Patients",
    headline: "Nigerian doctors abroad.\nCaring for Nigerians at home.",
    subline:
      "Thousands of Nigerian-trained doctors now practise abroad. DFC brings their expertise back home. Book a consultation, get a second opinion, or join the movement.",
    cta: { label: "Find a specialist", href: "/book" },
    secondary: { label: "Get a second opinion", href: "/second-opinion" },
    stat: { value: "400+", label: "Diaspora physicians" },
  },
  {
    id: 2,
    image: "/hero2.jpg",
    badge: "For Physicians",
    headline: "Practise in Nigeria again,\non your own terms.",
    subline:
      "Reconnect with patients at home. Earn meaningfully for your time and expertise. Give back to the system that shaped your beginnings.",
    cta: { label: "Join DFC", href: "/auth/join" },
    secondary: { label: "Learn more", href: "/about" },
    stat: { value: "15+", label: "Partner institutions" },
  },
  {
    id: 3,
    image: "/partners-hero.jpg",
    badge: "For Institutions",
    headline: "Work with the diaspora.\nStrengthen care at home.",
    subline:
      "Hospitals and health organisations partner with DFC to access specialist expertise, run outreaches, and shape health policy together.",
    cta: { label: "Become a partner", href: "/partners" },
    secondary: { label: "See our initiatives", href: "/#projects" },
    stat: { value: "6", label: "Active initiatives" },
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStart = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setProgress(0);
    progressRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => {
      const n = (prev + 1) % slides.length;
      return n;
    });
    setProgress(0);
    progressRef.current = 0;
    lastTimeRef.current = 0;
  }, []);

  // Smooth progress animation
  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      progressRef.current = Math.min((elapsed / INTERVAL) * 100, 100);
      setProgress(progressRef.current);

      if (progressRef.current >= 100) {
        next();
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, next, current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      goTo(
        diff < 0
          ? (current + 1) % slides.length
          : (current - 1 + slides.length) % slides.length
      );
    }
    touchStart.current = null;
  };

  const slide = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0D1F3C 0%, #122847 30%, #0A4A50 70%, #0D1F3C 100%)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse 80% 60% at 20% 80%, #0A4A50 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 60% 50% at 80% 20%, #1a5c63 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(ellipse 40% 40% at 60% 70%, #0e6b5e 0%, transparent 50%)" }} />
      </div>

      {/* Floating bokeh orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[300px] h-[300px] rounded-full bg-white/[0.03] blur-3xl animate-[float1_20s_ease-in-out_infinite]" style={{ top: "10%", left: "-5%" }} />
        <div className="absolute w-[200px] h-[200px] rounded-full bg-[#0A4A50]/20 blur-2xl animate-[float2_15s_ease-in-out_infinite]" style={{ top: "60%", right: "5%" }} />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-white/[0.02] blur-3xl animate-[float3_18s_ease-in-out_infinite]" style={{ bottom: "5%", left: "30%" }} />
        <div className="absolute w-[150px] h-[150px] rounded-full bg-[#0A4A50]/15 blur-2xl animate-[float1_22s_ease-in-out_infinite_reverse]" style={{ top: "25%", right: "25%" }} />
        <div className="absolute w-[100px] h-[100px] rounded-full bg-white/[0.04] blur-xl animate-[float2_12s_ease-in-out_infinite]" style={{ top: "40%", left: "15%" }} />
      </div>

      {/* Subtle dot grid texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      {/* Abstract light streaks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[25deg] animate-[shimmer_8s_ease-in-out_infinite]" style={{ top: "30%", left: "-10%" }} />
        <div className="absolute w-[400px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent rotate-[15deg] animate-[shimmer_12s_ease-in-out_infinite_2s]" style={{ top: "65%", right: "-5%" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center min-h-[440px]">

          {/* Left — Text content */}
          <div className="order-2 lg:order-1">
            {/* Headline */}
            <h1
              key={`h-${current}`}
              className="text-3xl sm:text-4xl md:text-[3.25rem] font-bold text-white leading-[1.12] whitespace-pre-line animate-[fadeInUp_0.5s_ease-out_0.1s_both]"
            >
              {slide.headline}
            </h1>

            {/* Subline */}
            <p
              key={`sub-${current}`}
              className="mt-5 text-lg text-white/75 leading-relaxed max-w-[480px] animate-[fadeInUp_0.5s_ease-out_0.2s_both]"
            >
              {slide.subline}
            </p>

            {/* CTAs */}
            <div
              key={`cta-${current}`}
              className="mt-8 flex flex-col sm:flex-row items-start gap-3 animate-[fadeInUp_0.5s_ease-out_0.3s_both]"
            >
              <Link
                href={slide.cta.href}
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base shadow-lg shadow-black/10 hover:bg-gray-50 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
              >
                {slide.cta.label}
              </Link>
              <Link
                href={slide.secondary.href}
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
              >
                {slide.secondary.label}
              </Link>
            </div>

          </div>

          {/* Right — Image in shaped container */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px] aspect-[4/5] lg:aspect-[3/4]">
              {/* Decorative ring behind image */}
              <div className="absolute -inset-3 rounded-[2.5rem] border border-white/10 -rotate-2" />

              {/* Image container */}
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-black/30">
                {slides.map((s, index) => (
                  <div
                    key={s.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      index === current ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.badge}
                      fill
                      priority={index === 0}
                      className="object-cover"
                      sizes="(max-width: 1024px) 90vw, 520px"
                    />
                    {/* Subtle bottom gradient for blending */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0D1F3C]/40 to-transparent" />
                  </div>
                ))}

                {/* Glass overlay card on image — floating stat */}
                <div className="absolute bottom-5 left-5 right-5 z-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/15 backdrop-blur-xl border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-sm text-white font-medium">
                    {current === 0 && "Specialists available now"}
                    {current === 1 && "Open to new members"}
                    {current === 2 && "Accepting partnerships"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress-bar navigation */}
        <div className="mt-12 flex items-center gap-3">
          {slides.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="group flex items-center gap-2 cursor-pointer"
            >
              <span
                className={`text-sm font-medium transition-all duration-300 hidden sm:inline ${
                  index === current
                    ? "text-white/90"
                    : "text-white/30 group-hover:text-white/60"
                }`}
              >
                {s.badge}
              </span>
              <div className="relative w-12 h-[3px] rounded-full bg-white/15 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white transition-none"
                  style={{
                    width:
                      index === current
                        ? `${progress}%`
                        : index < current
                          ? "100%"
                          : "0%",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -30px) scale(1.15); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.05); }
          75% { transform: translate(-30px, 30px) scale(0.9); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0; transform: translateX(-100%) rotate(25deg); }
          50% { opacity: 1; transform: translateX(100%) rotate(25deg); }
        }
      `}</style>
    </section>
  );
}
