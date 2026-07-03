"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Video,
  Shield,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  Users,
  Star,
  Phone,
  Stethoscope,
  Heart,
  Lightbulb,
} from "lucide-react";
import { SecondOpinionForm } from "./SecondOpinionForm";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: "88%", label: "of patients receive a new or refined diagnosis with a second opinion" },
  { value: "72hrs", label: "turnaround for your written specialist report" },
  { value: "400+", label: "diaspora-trained specialists across 22 specialties" },
];

const STEPS = [
  {
    number: "01",
    title: "Tell us about your case",
    description:
      "Fill out a short form with your diagnosis, medical history, and any questions you want answered. Takes about 10 minutes.",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 text-blue-600",
  },
  {
    number: "02",
    title: "We match you with a specialist",
    description:
      "Our secretariat reviews your case and assigns a diaspora-trained specialist in the relevant field. We handle everything.",
    icon: Users,
    color: "from-[#0A6E75] to-teal-600",
    bg: "bg-teal-50 text-teal-600",
  },
  {
    number: "03",
    title: "Receive your report",
    description:
      "Your reviewing specialist delivers a written report with their independent assessment. Complex tiers include a video call.",
    icon: CheckCircle,
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50 text-emerald-600",
  },
];

const FEATURED_SPECIALTIES = [
  "Oncology", "Neurosurgery", "Cardiothoracic Surgery", "Orthopaedic Surgery",
  "Nephrology", "Gastroenterology", "Haematology", "Endocrinology",
  "Urology", "Paediatric Surgery", "Vascular Surgery", "Internal Medicine",
  "Obstetrics & Gynaecology", "Ophthalmology",
];

const SPECIALTY_COLORS = [
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-red-50 text-red-700 border-red-200",
  "bg-slate-50 text-slate-700 border-slate-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-red-50 text-red-700 border-red-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
];

const TIERS = [
  {
    name: "Standard Review",
    price: "85,000",
    turnaround: "72 hours",
    features: [
      "Written specialist report",
      "Independent diagnosis review",
      "Treatment recommendations",
      "Follow-up questions via email",
    ],
    recommended: false,
    accent: "from-blue-500 to-indigo-600",
  },
  {
    name: "Complex / Surgical",
    price: "150,000",
    turnaround: "5 working days",
    features: [
      "Everything in Standard",
      "20-minute video call with specialist",
      "Detailed surgical assessment",
      "Alternative treatment options",
    ],
    recommended: true,
    accent: "from-[#0A6E75] to-teal-600",
  },
  {
    name: "Oncology Review",
    price: "180,000",
    turnaround: "5 working days",
    features: [
      "Everything in Standard",
      "30-minute video call with oncologist",
      "Staging and treatment plan review",
      "Clinical trial eligibility notes",
    ],
    recommended: false,
    accent: "from-rose-500 to-pink-600",
  },
];

const TESTIMONIALS = [
  {
    quote: "My mother was told she needed surgery immediately. The DFC specialist reviewed her scans and recommended a less invasive approach that worked. We are so grateful.",
    name: "Chioma A.", location: "Lagos", rating: 5,
  },
  {
    quote: "As a physician myself, I wanted a colleague I could trust to look at my father's case. The report was thorough and gave us clarity we did not have before.",
    name: "Dr. Emeka O.", location: "Abuja", rating: 5,
  },
  {
    quote: "The video call made all the difference. The specialist took time to explain everything and answer our questions. Worth every naira.",
    name: "Folake M.", location: "Ibadan", rating: 5,
  },
];

const FAQS = [
  { q: "Do I need my doctor's permission to get a second opinion?", a: "No. You have every right to seek an independent review of your diagnosis or treatment plan. Most doctors welcome it." },
  { q: "What documents do I need?", a: "Bring whatever you have: lab results, imaging reports (CT, MRI, X-ray), pathology reports, previous specialist letters, or discharge summaries. We will work with what is available." },
  { q: "How long does it take to receive my report?", a: "Standard reviews are delivered within 72 hours. Complex and oncology reviews take up to 5 working days. We will notify you by email when your report is ready." },
  { q: "Who are the reviewing specialists?", a: "All reviewers are DFC-registered physicians with specialist training from institutions in the UK, US, Canada, or other diaspora jurisdictions. Every specialist is peer-endorsed by at least two DFC members." },
  { q: "Is this an emergency service?", a: "No. If you are experiencing a medical emergency, please call 112 or go to your nearest emergency department. This service is for non-urgent, planned reviews." },
  { q: "What happens after I receive my report?", a: "You can share the report with your treating physician, use it to make informed decisions, or request a follow-up consultation if you have additional questions." },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
      >
        <span className="text-base font-medium text-[#0D1F3C] pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-base text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Landing Component                                             */
/* ------------------------------------------------------------------ */

export function SecondOpinionLanding() {
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#F8F9FB]">
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight">
              Before you decide,
              <br />
              <span className="text-emerald-300">
                get a second pair of eyes.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-xl">
              An independent review of your diagnosis or treatment plan from a
              diaspora-trained Nigerian specialist. No travel. No waiting list.
              Written report in as little as 72 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <button
                onClick={scrollToForm}
                className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base shadow-lg shadow-black/10 hover:bg-gray-50 hover:-translate-y-px active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                Request a second opinion
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-13 px-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-base hover:bg-white/20 transition-all duration-200"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ────────────────────────────────────── */}
      <section className="relative -mt-6 z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STATS.map((stat) => (
              <div key={stat.value} className="flex items-start gap-4">
                <span className="text-2xl font-bold text-[#0A6E75] shrink-0">
                  {stat.value}
                </span>
                <p className="text-sm text-gray-600 leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY IT MATTERS ───────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Why it matters</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Make Informed Health Decisions
            </h2>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
              Research shows that nearly 9 in 10 patients who seek a second
              opinion receive a new or refined diagnosis. A second opinion is not
              about doubting your doctor &mdash; it&apos;s about making the most informed
              decision about your health.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Confirm your diagnosis", text: "Know for sure that your diagnosis is accurate before committing to a treatment plan, especially for serious conditions.", color: "from-rose-500 to-pink-600", bg: "bg-rose-50 text-rose-600" },
              { icon: Lightbulb, title: "Explore your options", text: "A fresh set of eyes may identify alternative treatments, less invasive approaches, or newer therapies your team has not considered.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 text-blue-600" },
              { icon: Heart, title: "Peace of mind", text: "Whether the second opinion agrees or disagrees, you will have the confidence that comes from knowing you have done your homework.", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 text-emerald-600" },
            ].map((item) => (
              <div key={item.title} className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${item.color}`} />
                <div className="p-6 text-center">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Three Steps. We Handle the Rest.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="relative group bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${step.color}`} />
                <div className="p-6">
                  <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center mb-4`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#0A6E75] uppercase tracking-wider">Step {step.number}</span>
                  <h3 className="text-lg font-bold text-[#0D1F3C] mt-1 mb-2">{step.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#0A6E75] text-white font-semibold text-base hover:bg-[#085c62] hover:shadow-lg hover:shadow-[#0A6E75]/20 transition-all duration-200 cursor-pointer"
            >
              Begin your request <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── SPECIALTIES ──────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Coverage</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Specialties Covered
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto">
              Our network covers over 20 medical and surgical specialties. If
              your condition is not listed, submit your request and we will find
              the right specialist.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {FEATURED_SPECIALTIES.map((s, i) => (
              <span
                key={s}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${SPECIALTY_COLORS[i % SPECIALTY_COLORS.length]}`}
              >
                {s}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#0D1F3C] to-[#0A6E75] text-sm font-medium text-white shadow-sm">
              + 8 more
            </span>
          </div>
        </div>
      </section>

      {/* ─── PRICING TIERS ────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Transparent Pricing
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto">
              One fee covers the full review. No hidden charges. Payment is
              collected after your case is accepted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                  tier.recommended
                    ? "border-2 border-[#0A6E75] shadow-lg shadow-[#0A6E75]/10"
                    : "border border-gray-200 shadow-sm"
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${tier.accent}`} />
                {tier.recommended && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-[#0A6E75] text-white text-xs font-bold rounded-full">
                    Most chosen
                  </span>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#0D1F3C]">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0D1F3C]">
                      {"\u20A6"}{tier.price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {tier.turnaround} turnaround
                  </p>
                  <ul className="mt-5 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-[#0A6E75] mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={scrollToForm}
                    className={`mt-6 w-full h-12 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      tier.recommended
                        ? "bg-[#0A6E75] text-white hover:bg-[#085c62] hover:shadow-lg hover:shadow-[#0A6E75]/20"
                        : "bg-white text-[#0D1F3C] border-2 border-gray-200 hover:border-[#0A6E75] hover:text-[#0A6E75]"
                    }`}
                  >
                    Select this tier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST SIGNALS ────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: Shield, label: "MDCN Verified", desc: "All specialists hold valid licences" },
                { icon: Users, label: "Peer-Endorsed", desc: "Minimum 2 peer endorsements" },
                { icon: Clock, label: "Fast Turnaround", desc: "Reports in 72 hours to 5 days" },
                { icon: Video, label: "Video Consultations", desc: "Available on Complex + Oncology" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="w-12 h-12 rounded-xl bg-[#0A6E75]/10 text-[#0A6E75] flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#0D1F3C]">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              What Patients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-base text-gray-700 leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D1F3C] to-[#0A6E75] flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-[#0D1F3C]">
              Common Questions
            </h2>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 sm:p-8">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE FORM ─────────────────────────────────────── */}
      <section ref={formRef} id="request-form" className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Get started</p>
            <h2 className="text-3xl font-bold text-[#0D1F3C]">
              Submit Your Request
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Fill out the form below and our secretariat will be in touch
              within one working day.
            </p>
          </div>
          <SecondOpinionForm />
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Your Health Decisions Deserve Certainty
          </h2>
          <p className="mt-4 text-lg text-white/60 leading-relaxed max-w-lg mx-auto">
            Getting a second opinion should not be complicated. Tell us about
            your case and let our specialists do the rest.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer shadow-md"
            >
              Request a second opinion
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="tel:+2341234567890"
              className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium text-base hover:bg-white/20 transition-all duration-200"
            >
              <Phone className="w-4 h-4" />
              Call us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
