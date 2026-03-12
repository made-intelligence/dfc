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
    icon: <FileText className="w-6 h-6" />,
  },
  {
    number: "02",
    title: "We match you with a specialist",
    description:
      "Our secretariat reviews your case and assigns a diaspora-trained specialist in the relevant field. We handle everything.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    number: "03",
    title: "Receive your report",
    description:
      "Your reviewing specialist delivers a written report with their independent assessment. Complex tiers include a video call.",
    icon: <FileText className="w-6 h-6" />,
  },
];

const FEATURED_SPECIALTIES = [
  "Oncology",
  "Neurosurgery",
  "Cardiothoracic Surgery",
  "Orthopaedic Surgery",
  "Nephrology",
  "Gastroenterology",
  "Haematology",
  "Endocrinology",
  "Urology",
  "Paediatric Surgery",
  "Vascular Surgery",
  "Internal Medicine",
  "Obstetrics & Gynaecology",
  "Ophthalmology",
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
  },
];

const TESTIMONIALS = [
  {
    quote:
      "My mother was told she needed surgery immediately. The DFC specialist reviewed her scans and recommended a less invasive approach that worked. We are so grateful.",
    name: "Chioma A.",
    location: "Lagos",
    rating: 5,
  },
  {
    quote:
      "As a physician myself, I wanted a colleague I could trust to look at my father's case. The report was thorough and gave us clarity we did not have before.",
    name: "Dr. Emeka O.",
    location: "Abuja",
    rating: 5,
  },
  {
    quote:
      "The video call made all the difference. The specialist took time to explain everything and answer our questions. Worth every naira.",
    name: "Folake M.",
    location: "Ibadan",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Do I need my doctor's permission to get a second opinion?",
    a: "No. You have every right to seek an independent review of your diagnosis or treatment plan. Most doctors welcome it.",
  },
  {
    q: "What documents do I need?",
    a: "Bring whatever you have: lab results, imaging reports (CT, MRI, X-ray), pathology reports, previous specialist letters, or discharge summaries. We will work with what is available.",
  },
  {
    q: "How long does it take to receive my report?",
    a: "Standard reviews are delivered within 72 hours. Complex and oncology reviews take up to 5 working days. We will notify you by email when your report is ready.",
  },
  {
    q: "Who are the reviewing specialists?",
    a: "All reviewers are DFC-registered physicians with specialist training from institutions in the UK, US, Canada, or other diaspora jurisdictions. Every specialist is peer-endorsed by at least two DFC members.",
  },
  {
    q: "Is this an emergency service?",
    a: "No. If you are experiencing a medical emergency, please call 112 or go to your nearest emergency department. This service is for non-urgent, planned reviews.",
  },
  {
    q: "What happens after I receive my report?",
    a: "You can share the report with your treating physician, use it to make informed decisions, or request a follow-up consultation if you have additional questions.",
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
      >
        <span className="text-base font-medium text-gray-900 pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
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
    <main className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative bg-[#0D1F3C] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-16 lg:pt-40 lg:pb-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15]">
              Before you decide,{"\n"}
              <span className="text-white/80">get a second pair of eyes.</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-xl">
              An independent review of your diagnosis or treatment plan from a
              diaspora-trained Nigerian specialist. No travel. No waiting list.
              Written report in as little as 72 hours.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
              <button
                onClick={scrollToForm}
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base shadow-lg shadow-black/10 hover:bg-gray-50 hover:-translate-y-px active:translate-y-0 transition-all duration-200 cursor-pointer"
              >
                Request a second opinion
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-all duration-200"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                   */}
      {/* ============================================================ */}
      <section className="bg-[#0A4A50]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STATS.map((stat) => (
              <div key={stat.value} className="flex items-start gap-4">
                <span className="text-2xl font-bold text-white shrink-0">
                  {stat.value}
                </span>
                <p className="text-sm text-white/80 leading-snug">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WHY GET A SECOND OPINION                                    */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Why it matters
            </h2>
            <p className="mt-4 text-base text-gray-600 leading-relaxed">
              Research shows that nearly 9 in 10 patients who seek a second
              opinion receive a new or refined diagnosis. A second opinion is not
              about doubting your doctor. It is about making the most informed
              decision about your health.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                Confirm your diagnosis
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Know for sure that your diagnosis is accurate before committing
                to a treatment plan, especially for serious conditions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                Explore your options
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                A fresh set of eyes may identify alternative treatments, less
                invasive approaches, or newer therapies your team has not
                considered.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                Peace of mind
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Whether the second opinion agrees or disagrees, you will have
                the confidence that comes from knowing you have done your
                homework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS                                                */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              How it works
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Three steps. We handle the coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-gray-300 -translate-x-1/2" />
                )}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <span className="text-sm font-bold text-[#0A4A50] mb-3 block">
                    STEP {step.number}
                  </span>
                  <h3 className="text-lg font-semibold text-[#0D1F3C] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#0D1F3C] text-white font-semibold text-base hover:bg-[#162d52] transition-colors cursor-pointer"
            >
              Begin your request <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SPECIALTIES                                                 */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Specialties covered
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto">
              Our network covers over 20 medical and surgical specialties. If
              your condition is not listed, submit your request and we will find
              the right specialist.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {FEATURED_SPECIALTIES.map((s) => (
              <span
                key={s}
                className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium text-gray-700 border border-gray-200"
              >
                {s}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full bg-[#0D1F3C] text-sm font-medium text-white">
              + 8 more
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING TIERS                                               */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Transparent pricing
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
                className={`relative bg-white rounded-2xl border p-6 ${
                  tier.recommended
                    ? "border-[#0D1F3C] ring-2 ring-[#0D1F3C]"
                    : "border-gray-200"
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0D1F3C] text-white text-xs font-semibold rounded-full">
                    Most chosen
                  </span>
                )}
                <h3 className="text-lg font-semibold text-[#0D1F3C]">
                  {tier.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#0D1F3C]">
                    {"\u20A6"}{tier.price}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {tier.turnaround} turnaround
                </p>
                <ul className="mt-5 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToForm}
                  className={`mt-6 w-full h-11 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    tier.recommended
                      ? "bg-[#0D1F3C] text-white hover:bg-[#162d52]"
                      : "bg-white text-[#0D1F3C] border border-[#0D1F3C] hover:bg-gray-50"
                  }`}
                >
                  Select this tier
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TRUST SIGNALS                                               */}
      {/* ============================================================ */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Shield className="w-8 h-8 text-[#0D1F3C] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0D1F3C]">MDCN Verified</p>
              <p className="text-xs text-gray-500 mt-1">All specialists hold valid licences</p>
            </div>
            <div>
              <Users className="w-8 h-8 text-[#0D1F3C] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0D1F3C]">Peer-Endorsed</p>
              <p className="text-xs text-gray-500 mt-1">Minimum 2 peer endorsements</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-[#0D1F3C] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0D1F3C]">Fast Turnaround</p>
              <p className="text-xs text-gray-500 mt-1">Reports in 72 hours to 5 days</p>
            </div>
            <div>
              <Video className="w-8 h-8 text-[#0D1F3C] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0D1F3C]">Video Consultations</p>
              <p className="text-xs text-gray-500 mt-1">Available on Complex and Oncology tiers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              What patients say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl border border-gray-200 p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-base text-gray-800 leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {t.name}
                </p>
                <p className="text-sm text-gray-500">{t.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ                                                         */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Common questions
            </h2>
          </div>
          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  THE FORM                                                    */}
      {/* ============================================================ */}
      <section
        ref={formRef}
        id="request-form"
        className="py-16 sm:py-20 bg-white"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1F3C]">
              Submit your request
            </h2>
            <p className="mt-3 text-base text-gray-600">
              Fill out the form below and our secretariat will be in touch
              within one working day.
            </p>
          </div>
          <SecondOpinionForm />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                   */}
      {/* ============================================================ */}
      <section className="bg-[#0D1F3C] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Your health decisions deserve certainty
          </h2>
          <p className="mt-4 text-base text-white/70 leading-relaxed max-w-lg mx-auto">
            Getting a second opinion should not be complicated. Tell us about
            your case and let our specialists do the rest.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white text-[#0D1F3C] font-semibold text-base hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Request a second opinion
            </button>
            <a
              href="tel:+2341234567890"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-colors"
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
