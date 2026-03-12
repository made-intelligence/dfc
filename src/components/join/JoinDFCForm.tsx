'use client';

import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SPECIALTIES } from '@/lib/specialties';

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Nigeria',
  'Canada',
  'Ireland',
  'Germany',
  'Australia',
  'Other',
] as const;

type MemberPath = 'diaspora' | 'local_specialist' | 'associate';

interface PathOption {
  key: MemberPath;
  heading: string;
  badge: string;
  rights: string[];
  note?: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    key: 'diaspora',
    heading: 'I am a Nigerian-trained physician practising abroad',
    badge: 'Full Member',
    rights: [
      'Vote and hold office',
      'Serve on committees and TWGs',
      'Full marketplace access',
      'Schedule Nigeria visit windows',
    ],
  },
  {
    key: 'local_specialist',
    heading: 'I am a specialist practising in Nigeria',
    badge: 'Local Specialist Network',
    rights: [
      'Receive referrals from diaspora colleagues',
      'Collaborate on second opinion cases',
      'Access Knowledge Hub',
    ],
    note: 'Subject to 4-stage verification: document review, credentials check, peer endorsement, and committee approval.',
  },
  {
    key: 'associate',
    heading: 'I am currently in specialist training outside Nigeria',
    badge: 'Associate Member',
    rights: [
      'Platform and Knowledge Hub access',
      'Attend DFC events and webinars',
      'No voting rights until upgraded to Full Member',
    ],
  },
];

interface FormData {
  path: MemberPath | null;
  title: string;
  fullName: string;
  primarySpecialty: string;
  subSpecialty: string;
  licenceNumber: string;
  yearOfQualification: string;
  currentInstitution: string;
  countryOfPractice: string;
  mobile: string;
  email: string;
  password: string;
  whatsappOptIn: boolean;
}

const INITIAL_FORM: FormData = {
  path: null,
  title: '',
  fullName: '',
  primarySpecialty: '',
  subSpecialty: '',
  licenceNumber: '',
  yearOfQualification: '',
  currentInstitution: '',
  countryOfPractice: '',
  mobile: '',
  email: '',
  password: '',
  whatsappOptIn: true,
};

export function JoinDFCForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [confirmTerms, setConfirmTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (field: keyof FormData, value: string | boolean | MemberPath) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const licenceLabel =
    form.path === 'local_specialist'
      ? 'MDCN number'
      : 'Medical licence / registration number (e.g. GMC, MDCN, AMC, HPCSA)';

  const pathLabel = (key: MemberPath) =>
    PATH_OPTIONS.find((p) => p.key === key)?.badge ?? '';

  // ---- validation ----
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title) errs.title = 'Please select a title.';
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.primarySpecialty) errs.primarySpecialty = 'Please select a specialty.';
    if (!form.licenceNumber.trim()) errs.licenceNumber = `${licenceLabel} is required.`;
    if (!form.yearOfQualification) {
      errs.yearOfQualification = 'Year of qualification is required.';
    } else {
      const y = Number(form.yearOfQualification);
      if (y < 1950 || y > new Date().getFullYear()) {
        errs.yearOfQualification = 'Please enter a valid year.';
      }
    }
    if (!form.currentInstitution.trim())
      errs.currentInstitution = 'Current institution is required.';
    if (form.path !== 'local_specialist' && !form.countryOfPractice)
      errs.countryOfPractice = 'Please select a country.';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (step === 1 && !form.path) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!confirmAccuracy || !confirmTerms) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: form.path,
          title: form.title,
          name: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.mobile,
          specialty: form.primarySpecialty,
          subSpecialty: form.subSpecialty,
          licenceNumber: form.licenceNumber,
          institution: form.currentInstitution,
          country: form.path === 'local_specialist' ? 'Nigeria' : form.countryOfPractice,
          yearsQualified: form.yearOfQualification,
          whatsappOptIn: form.whatsappOptIn,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? 'Something went wrong. Please try again.');
      }
      setStep(4);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- step dots ----
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-semibold ${
              s < step
                ? 'bg-[#0A4A50] text-white'
                : s === step
                ? 'bg-[#0D1F3C] text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
          {s < 4 && (
            <div
              className={`w-10 h-0.5 ${s < step ? 'bg-[#0A4A50]' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ---- field helpers ----
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-red-600 text-sm mt-1">{errors[field]}</p>
    ) : null;

  const labelClass = 'block text-base font-medium text-gray-700 mb-1';
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#0A4A50] focus:border-transparent transition-shadow';
  const selectClass = `${inputClass} bg-white`;

  // ==============================================================
  // STEP 1
  // ==============================================================
  const renderStep1 = () => (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you?</h2>
      <p className="text-base text-gray-600 mb-6">
        Select the option that best describes your professional situation.
      </p>

      <div className="space-y-4">
        {PATH_OPTIONS.map((opt) => {
          const selected = form.path === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => update('path', opt.key)}
              className={`w-full text-left rounded-lg border-2 p-5 transition-colors ${
                selected
                  ? 'border-[#0A4A50] bg-[#0A4A50]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">
                    {opt.heading}
                  </p>
                  {opt.rights.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {opt.rights.map((r) => (
                        <li
                          key={r}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selected
                      ? 'bg-[#0D1F3C] text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {opt.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {form.path && PATH_OPTIONS.find((p) => p.key === form.path)?.note && (
        <div className="mt-5 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {PATH_OPTIONS.find((p) => p.key === form.path)?.note}
        </div>
      )}
    </>
  );

  // ==============================================================
  // STEP 2
  // ==============================================================
  const renderStep2 = () => (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Professional details
      </h2>
      <p className="text-base text-gray-600 mb-6">
        Provide your professional information. All fields are required unless
        marked otherwise.
      </p>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className={labelClass}>Title</label>
          <select
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className={selectClass}
          >
            <option value="">Select title</option>
            <option value="Dr.">Dr.</option>
            <option value="Prof.">Prof.</option>
            <option value="Mr. or Mrs. (Surgeon)">Mr. or Mrs. (Surgeon)</option>
          </select>
          <FieldError field="title" />
        </div>

        {/* Full name */}
        <div>
          <label className={labelClass}>Full name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className={inputClass}
            placeholder="As it appears on your medical licence"
          />
          <FieldError field="fullName" />
        </div>

        {/* Primary specialty */}
        <div>
          <label className={labelClass}>Primary specialty</label>
          <select
            value={form.primarySpecialty}
            onChange={(e) => update('primarySpecialty', e.target.value)}
            className={selectClass}
          >
            <option value="">Select specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <FieldError field="primarySpecialty" />
        </div>

        {/* Sub-specialty */}
        <div>
          <label className={labelClass}>
            Sub-specialty{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.subSpecialty}
            onChange={(e) => update('subSpecialty', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Licence number */}
        <div>
          <label className={labelClass}>{licenceLabel}</label>
          <input
            type="text"
            value={form.licenceNumber}
            onChange={(e) => update('licenceNumber', e.target.value)}
            className={inputClass}
          />
          <FieldError field="licenceNumber" />
        </div>

        {/* Year of qualification */}
        <div>
          <label className={labelClass}>Year of primary qualification</label>
          <input
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={form.yearOfQualification}
            onChange={(e) => update('yearOfQualification', e.target.value)}
            className={inputClass}
            placeholder="e.g. 2005"
          />
          <FieldError field="yearOfQualification" />
        </div>

        {/* Institution */}
        <div>
          <label className={labelClass}>Current institution / hospital</label>
          <input
            type="text"
            value={form.currentInstitution}
            onChange={(e) => update('currentInstitution', e.target.value)}
            className={inputClass}
          />
          <FieldError field="currentInstitution" />
        </div>

        {/* Country */}
        {form.path === 'local_specialist' ? (
          <div>
            <label className={labelClass}>Country of current practice</label>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-base text-gray-700">
              Nigeria
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass}>Country of current practice</label>
            <select
              value={form.countryOfPractice}
              onChange={(e) => update('countryOfPractice', e.target.value)}
              className={selectClass}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError field="countryOfPractice" />
          </div>
        )}

        {/* Mobile */}
        <div>
          <label className={labelClass}>
            Mobile number{' '}
            <span className="text-gray-400 font-normal">
              (for WhatsApp notifications)
            </span>
          </label>
          <input
            type="tel"
            value={form.mobile}
            onChange={(e) => update('mobile', e.target.value)}
            className={inputClass}
            placeholder="+44 7XXX XXXXXX"
          />
          <FieldError field="mobile" />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={inputClass}
          />
          <FieldError field="email" />
        </div>

        {/* Password */}
        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className={`${inputClass} pr-11`}
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <FieldError field="password" />
        </div>

        {/* WhatsApp opt-in */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.whatsappOptIn}
            onChange={(e) => update('whatsappOptIn', e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0A4A50] focus:ring-[#0A4A50]"
          />
          <span className="text-base text-gray-700">
            Receive DFC notifications via WhatsApp
          </span>
        </label>
      </div>
    </>
  );

  // ==============================================================
  // STEP 3
  // ==============================================================
  const renderStep3 = () => {
    const selectedPath = PATH_OPTIONS.find((p) => p.key === form.path);
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review and confirm
        </h2>
        <p className="text-base text-gray-600 mb-6">
          Please review your details before submitting your application.
        </p>

        {/* Path summary */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Membership path
          </p>
          <p className="text-base font-semibold text-gray-900">
            {selectedPath?.heading}
          </p>
          <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0A4A50]/10 text-[#0A4A50]">
            {selectedPath?.badge}
          </span>
          {selectedPath && selectedPath.rights.length > 0 && (
            <ul className="mt-3 space-y-1">
              {selectedPath.rights.map((r) => (
                <li key={r} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Details summary */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Professional details
          </p>
          <dl className="space-y-2 text-base">
            {([
              ['Name', `${form.title} ${form.fullName}`],
              ['Primary specialty', form.primarySpecialty],
              ...(form.subSpecialty
                ? [['Sub-specialty', form.subSpecialty]]
                : []),
              [licenceLabel, form.licenceNumber],
              ['Year of qualification', form.yearOfQualification],
              ['Institution', form.currentInstitution],
              ['Country', form.countryOfPractice],
              ['Mobile', form.mobile],
              ['Email', form.email],
              [
                'WhatsApp notifications',
                form.whatsappOptIn ? 'Opted in' : 'Opted out',
              ],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="text-gray-500 sm:w-48 shrink-0">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Confirmations */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmAccuracy}
              onChange={(e) => setConfirmAccuracy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0A4A50] focus:ring-[#0A4A50]"
            />
            <span className="text-base text-gray-700">
              I confirm the information I have provided is accurate and complete.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmTerms}
              onChange={(e) => setConfirmTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#0A4A50] focus:ring-[#0A4A50]"
            />
            <span className="text-base text-gray-700">
              I have read and agree to the DFC Constitution, Code of Conduct, and
              Privacy Policy.
            </span>
          </label>
        </div>

        {submitError && (
          <p className="text-red-600 text-sm mt-4">{submitError}</p>
        )}
      </>
    );
  };

  // ==============================================================
  // STEP 4
  // ==============================================================
  const renderStep4 = () => {
    const headings: Record<MemberPath, string> = {
      diaspora: 'Thank you for applying for Full Membership',
      local_specialist: 'Thank you for registering with the Local Specialist Network',
      associate: 'Thank you for applying as an Associate Member',
    };

    const nextSteps: Record<MemberPath, string> = {
      diaspora:
        'Your application will be reviewed by the Membership Committee. You will receive an email once your credentials have been verified and your membership has been approved.',
      local_specialist:
        'Your application will proceed through our 4-stage verification process: document review, credentials check, peer endorsement, and committee approval. You will be notified at each stage.',
      associate:
        'Your application will be reviewed shortly. Once approved, you will have access to the platform and Knowledge Hub. You will be notified by email.',
    };

    return (
      <div className="text-center py-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {form.path ? headings[form.path] : 'Application submitted'}
        </h2>
        <p className="text-base text-gray-600 max-w-md mx-auto mb-8">
          {form.path ? nextSteps[form.path] : ''}
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-base font-semibold text-[#0A4A50] hover:text-[#0D1F3C] underline underline-offset-2"
        >
          Sign in to your account &rarr;
        </Link>
      </div>
    );
  };

  // ==============================================================
  // RENDER
  // ==============================================================
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <StepIndicator />

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="text-base font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={step === 1 && !form.path}
              className="text-base font-semibold text-white bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md px-6 py-2.5 transition-colors"
            >
              Continue
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!confirmAccuracy || !confirmTerms || submitting}
              className="text-base font-semibold text-white bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md px-6 py-2.5 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
