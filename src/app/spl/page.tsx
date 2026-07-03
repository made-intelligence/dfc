"use client";

import { useState, useRef, FormEvent } from "react";

export default function SPLLandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    hmoName: "",
    livesUnderManagement: "",
    annualSpecialistClaims: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/spl/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          livesUnderManagement: Number(formData.livesUnderManagement),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const result = await response.json().catch(() => null);
        setError(result?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const specialties = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "ENT",
    "Gastroenterology",
    "General Surgery",
    "Haematology",
    "Nephrology",
    "Neurology",
    "Neurosurgery",
    "Obstetrics & Gynaecology",
    "Oncology",
    "Ophthalmology",
    "Orthopaedics",
    "Paediatrics",
    "Plastic Surgery",
    "Psychiatry",
    "Pulmonology",
    "Radiology",
    "Urology",
  ];

  const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];

  const tariffTiers = [
    {
      range: "Below 50%",
      adjustment: "+5% surcharge",
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      range: "50–74%",
      adjustment: "Standard rate",
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      range: "75–89%",
      adjustment: "-5% discount",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      range: "90–100%",
      adjustment: "-10% discount",
      color: "text-emerald-800",
      bg: "bg-emerald-100",
    },
    {
      range: "Above 100%",
      adjustment: "-12% discount",
      color: "text-emerald-900",
      bg: "bg-emerald-200",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <title>Specialist Partners Limited — DFC</title>
      <meta
        name="description"
        content="SPL delivers cost-efficient specialist care to HMO enrollees across 20 specialties. Pre-scheduled appointments, credentialed diaspora physicians, outcomes-measured — a commercial subsidiary of the Doctors Foundation for Care."
      />

      {/* Navigation Bar */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "#1B4332",
          borderBottomColor: "rgba(212, 168, 67, 0.3)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ color: "#D4A843" }}
              >
                SPL
              </span>
              <span className="hidden sm:inline text-sm text-white/70">
                Specialist Partners Limited
              </span>
            </div>
            <button
              onClick={scrollToForm}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
              style={{
                backgroundColor: "#D4A843",
                color: "#1B4332",
                minHeight: "44px",
              }}
            >
              Partner With Us
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#1B4332" }}
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#D4A843" }}
            >
              A DFC Commercial Subsidiary
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white font-serif">
              Cost-efficient specialist care for your enrollees. Delivered.
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/80">
              Pre-scheduled specialist appointments and elective procedures
              across 20 specialties — credentialed, technology-driven,
              outcomes-measured.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToForm}
                className="rounded-lg px-8 py-4 text-base font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#D4A843",
                  color: "#1B4332",
                  minHeight: "44px",
                }}
              >
                Request a partnership conversation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: "#1B4332" }}
            >
              The specialist care challenge
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              HMOs across Nigeria face compounding pressures on specialist
              service delivery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Rising specialist claims costs",
                description:
                  "Specialist disbursements grow faster than premium revenue, compressing margins quarter over quarter with limited levers for cost control.",
              },
              {
                number: "02",
                title: "Limited verified provider supply",
                description:
                  "Finding credentialed specialists with confirmed availability remains a manual, relationship-dependent process that does not scale.",
              },
              {
                number: "03",
                title: "Manual referral processes",
                description:
                  "Paper-based referrals, fragmented follow-up, and absent outcomes data make it impossible to measure or improve specialist care quality.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="bg-white rounded-xl border border-gray-200 p-8"
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: "#D4A843" }}
                >
                  {item.number}
                </span>
                <h3
                  className="mt-3 text-xl font-semibold font-serif"
                  style={{ color: "#1B4332" }}
                >
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The SPL Model */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: "#1B4332" }}
            >
              The SPL model
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Volume commitments drive preferred tariffs. Preferred tariffs fund
              outcomes reporting. Outcomes reporting justifies volume
              commitments.
            </p>
          </div>

          {/* Tariff Table */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="px-6 py-4"
                style={{ backgroundColor: "#1B4332" }}
              >
                <h3 className="text-lg font-semibold text-white font-serif">
                  Volume-based tariff schedule
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  Based on percentage of committed specialist volume delivered
                  per period
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Volume Delivered
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                      Tariff Adjustment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tariffTiers.map((tier, index) => (
                    <tr
                      key={tier.range}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-4 text-base text-gray-900">
                        {tier.range}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tier.bg} ${tier.color}`}
                        >
                          {tier.adjustment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* The Specialist Network */}
      <section
        className="py-16 sm:py-24"
        style={{ backgroundColor: "#1B4332" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
              The specialist network
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Credentialed physicians. Verified availability. National coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { value: "20", label: "Medical specialties" },
              { value: "300+", label: "Verified diaspora physicians" },
              { value: "5", label: "Major cities covered" },
              { value: "100%", label: "DFC credential-verified" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <p
                  className="text-3xl sm:text-4xl font-bold font-serif"
                  style={{ color: "#D4A843" }}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-base text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Specialties Grid */}
          <div className="mb-16">
            <h3
              className="text-lg font-semibold mb-6 text-center"
              style={{ color: "#D4A843" }}
            >
              Specialties
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div>
            <h3
              className="text-lg font-semibold mb-6 text-center"
              style={{ color: "#D4A843" }}
            >
              Coverage
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {cities.map((city) => (
                <span
                  key={city}
                  className="rounded-lg px-6 py-3 text-base font-medium text-white"
                  style={{
                    backgroundColor: "rgba(212, 168, 67, 0.15)",
                    border: "1px solid rgba(212, 168, 67, 0.3)",
                  }}
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Technology */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: "#1B4332" }}
            >
              The technology
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Purpose-built infrastructure for managed specialist care.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                title: "EMR-native claims",
                description:
                  "ICD-10 coded from day one. Every encounter generates structured claims data ready for reconciliation — no post-hoc coding required.",
              },
              {
                title: "Prescription management",
                description:
                  "Digital prescriptions with formulary awareness. Track fills, substitutions, and adherence across the care episode.",
              },
              {
                title: "Diagnostic integration",
                description:
                  "Lab and imaging orders flow directly to partner facilities. Results return to the referring physician within the same record.",
              },
              {
                title: "Outcomes dashboard",
                description:
                  "Real-time visibility into case volume, resolution rates, patient satisfaction, and specialist performance metrics.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 p-8"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(27, 67, 50, 0.08)" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#D4A843" }}
                  />
                </div>
                <h3
                  className="text-lg font-semibold font-serif"
                  style={{ color: "#1B4332" }}
                >
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Numbers */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl font-bold font-serif"
              style={{ color: "#1B4332" }}
            >
              The numbers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div
              className="rounded-xl p-8 sm:p-10"
              style={{ backgroundColor: "#1B4332" }}
            >
              <p
                className="text-4xl sm:text-5xl font-bold font-serif"
                style={{ color: "#D4A843" }}
              >
                12%
              </p>
              <p className="mt-4 text-lg leading-relaxed text-white/90">
                HMOs that commit 30%+ of specialist disbursements to SPL receive
                tariffs up to 12% below standard rates.
              </p>
            </div>
            <div
              className="rounded-xl p-8 sm:p-10 border"
              style={{ borderColor: "rgba(27, 67, 50, 0.2)" }}
            >
              <p
                className="text-4xl sm:text-5xl font-bold font-serif"
                style={{ color: "#1B4332" }}
              >
                &#8358;4,000
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Per life signup fee funds working capital — discounted 50% for
                equity partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Inquiry Form */}
      <section
        ref={formRef}
        id="inquiry"
        className="py-16 sm:py-24 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-2xl sm:text-3xl font-bold font-serif"
                style={{ color: "#1B4332" }}
              >
                Partnership inquiry
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Tell us about your organisation. A member of the SPL partnerships
                team will respond within two business days.
              </p>
            </div>

            {submitted ? (
              <div
                className="rounded-xl p-10 sm:p-12 text-center"
                style={{ backgroundColor: "rgba(27, 67, 50, 0.04)" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "rgba(27, 67, 50, 0.1)" }}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="#1B4332"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <h3
                  className="text-2xl font-bold font-serif"
                  style={{ color: "#1B4332" }}
                >
                  Thank you for your interest
                </h3>
                <p className="mt-4 text-lg text-gray-600">
                  We have received your inquiry. A member of the SPL partnerships
                  team will be in touch within two business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Your name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hmoName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      HMO name
                    </label>
                    <input
                      id="hmoName"
                      type="text"
                      required
                      value={formData.hmoName}
                      onChange={(e) => updateField("hmoName", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="Organisation name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="livesUnderManagement"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Lives under management
                    </label>
                    <input
                      id="livesUnderManagement"
                      type="number"
                      required
                      min="1"
                      value={formData.livesUnderManagement}
                      onChange={(e) =>
                        updateField("livesUnderManagement", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="Number of covered lives"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="annualSpecialistClaims"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Annual specialist claims estimate
                    </label>
                    <input
                      id="annualSpecialistClaims"
                      type="text"
                      required
                      value={formData.annualSpecialistClaims}
                      onChange={(e) =>
                        updateField("annualSpecialistClaims", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="e.g. ₦500M annually"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="you@hmo.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={
                        {
                          "--tw-ring-color": "#1B4332",
                          minHeight: "44px",
                        } as React.CSSProperties
                      }
                      placeholder="+234"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto rounded-lg px-10 py-4 text-base font-semibold transition-opacity disabled:opacity-50"
                    style={{
                      backgroundColor: "#1B4332",
                      color: "#D4A843",
                      minHeight: "44px",
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit inquiry"}
                  </button>
                </div>

                <p className="text-sm text-gray-500">
                  Your information is handled in accordance with the{" "}
                  <a
                    href="/privacy-policy"
                    className="underline"
                    style={{ color: "#1B4332" }}
                  >
                    DFC Privacy Policy
                  </a>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 border-t"
        style={{
          backgroundColor: "#1B4332",
          borderTopColor: "rgba(212, 168, 67, 0.2)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">
                Specialist Partners Limited — A commercial subsidiary of the
                Doctors Foundation for Care.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/privacy-policy"
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
