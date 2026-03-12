'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle } from 'lucide-react';

const SPECIALTIES = [
  { name: 'Oncology', scope: 'Cancer diagnosis, staging, treatment plan review' },
  { name: 'Neurosurgery', scope: 'Brain and spinal surgical indication review' },
  { name: 'Cardiothoracic Surgery', scope: 'Cardiac and thoracic surgical assessment' },
  { name: 'Orthopaedic Surgery', scope: 'Fractures, joint replacement, spinal surgery' },
  { name: 'Nephrology', scope: 'Kidney disease, dialysis, transplant workup' },
  { name: 'Gastroenterology', scope: 'GI tract, liver disease, endoscopy review' },
  { name: 'Haematology', scope: 'Blood disorders, sickle cell, lymphoma staging' },
  { name: 'Endocrinology', scope: 'Thyroid, diabetes complications, adrenal conditions' },
  { name: 'Urology', scope: 'Urological conditions, prostate, kidney stones' },
  { name: 'Paediatric Surgery', scope: 'Paediatric surgical conditions' },
  { name: 'Vascular Surgery', scope: 'Vascular conditions, aneurysms, peripheral disease' },
  { name: 'Internal Medicine', scope: 'General medical conditions, multi-system disease' },
  { name: 'Obstetrics & Gynaecology', scope: 'Pregnancy, gynaecological conditions' },
  { name: 'Ophthalmology', scope: 'Eye conditions, surgical assessment' },
];

const TIERS = [
  {
    id: 'STANDARD',
    name: 'Standard',
    price: '85,000',
    priceKobo: 8500000,
    turnaround: '72-hour turnaround',
    deliverable: 'Written report',
  },
  {
    id: 'COMPLEX',
    name: 'Complex / Surgical',
    price: '150,000',
    priceKobo: 15000000,
    turnaround: '5 working days',
    deliverable: 'Written report + 20-min video call',
  },
  {
    id: 'ONCOLOGY',
    name: 'Oncology Review',
    price: '180,000',
    priceKobo: 18000000,
    turnaround: '5 working days',
    deliverable: 'Written report + 30-min video call',
  },
];

interface UploadedDoc {
  url: string;
  name: string;
  type: string;
  size: number;
  cloudinaryId?: string;
  uploadedAt: string;
}

interface AiSuggestion {
  specialty: string;
  confidence: string;
  reasoning: string;
}

export function SecondOpinionForm() {
  const [step, setStep] = useState(1);

  // Step 1
  const [requesterType, setRequesterType] = useState<string>('patient');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [proposedTreatment, setProposedTreatment] = useState('');
  const [specificQuestions, setSpecificQuestions] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 3
  const [selectedTier, setSelectedTier] = useState('');
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [consentShare, setConsentShare] = useState(false);
  const [consentNotEmergency, setConsentNotEmergency] = useState(false);

  // Submission + Payment
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    referenceNumber: string;
    caseId: string;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const resolvedSpecialty = selectedSpecialty || customCondition;

  async function checkSpecialty() {
    if (diagnosis.length < 30) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch('/api/second-opinion/route-specialty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: diagnosis }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestion({
          specialty: data.specialty,
          confidence: data.confidence,
          reasoning: data.reasoning,
        });
      }
    } catch {
      // Silently fail
    } finally {
      setAiLoading(false);
    }
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    const newDocs: UploadedDoc[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/second-opinion/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.document) {
          newDocs.push(data.document);
        } else {
          setError(data.error || `Failed to upload ${file.name}`);
        }
      } catch {
        setError(`Failed to upload ${file.name}`);
      }
    }

    setDocuments((prev) => [...prev, ...newDocs]);
    setUploading(false);
  }, []);

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/second-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          patientDob: dateOfBirth || undefined,
          contactEmail,
          contactPhone: contactPhone || undefined,
          specialty: resolvedSpecialty,
          diagnosis,
          proposedTreatment: proposedTreatment || undefined,
          specificQuestions: specificQuestions || undefined,
          tier: selectedTier,
          requesterType,
          documents: documents.length > 0 ? documents : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSuccess({ referenceNumber: data.referenceNumber, caseId: data.caseId });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment() {
    if (!success) return;
    setPaymentLoading(true);
    setError('');
    try {
      const res = await fetch('/api/second-opinion/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: success.caseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Payment initialization failed');
        return;
      }
      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch {
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  }

  const canProceedStep1 = patientName.trim() && contactEmail.trim() && dateOfBirth;
  const canProceedStep2 = resolvedSpecialty && diagnosis.trim().length >= 10;
  const canSubmit = selectedTier && consentShare && consentNotEmergency;

  const selectedTierData = TIERS.find((t) => t.id === selectedTier);

  // Success + Payment state
  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request submitted</h2>
        <p className="text-gray-600 mb-4">
          Your second opinion request has been received. Please complete payment to place your case in the review queue.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 inline-block mb-6">
          <p className="text-sm text-gray-500 mb-1">Reference number</p>
          <p className="text-lg font-mono font-bold text-gray-900">{success.referenceNumber}</p>
        </div>

        {selectedTierData && (
          <div className="bg-[#0D1F3C]/5 rounded-xl p-5 mb-6 max-w-sm mx-auto">
            <p className="text-sm font-medium text-gray-600 mb-1">Amount due</p>
            <p className="text-3xl font-bold text-[#0D1F3C]">
              {'\u20A6'}{selectedTierData.price}
            </p>
            <p className="text-sm text-gray-500 mt-1">{selectedTierData.name} — {selectedTierData.turnaround}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={paymentLoading}
          className="w-full sm:w-auto px-8 py-3 bg-[#0D1F3C] text-white text-base font-semibold rounded-xl hover:bg-[#162d52] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {paymentLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            `Pay \u20A6${selectedTierData?.price || ''}`
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Secure payment powered by Paystack. A confirmation will be sent to{' '}
          <span className="font-medium">{contactEmail}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s === step
                    ? 'bg-[#0D1F3C] text-white'
                    : s < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  s
                )}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  s === step ? 'font-semibold text-gray-900' : 'text-gray-400'
                }`}
              >
                {s === 1 ? 'About you' : s === 2 ? 'Clinical details' : 'Tier & documents'}
              </span>
              {s < 3 && <div className="w-4 sm:w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: About the request */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-base font-medium text-gray-900 mb-3">
                This request is being made by
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                {[
                  { value: 'patient', label: 'The patient or a family member' },
                  { value: 'physician', label: 'A referring physician' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer flex-1 transition-colors ${
                      requesterType === opt.value
                        ? 'border-[#0D1F3C] bg-[#0D1F3C]/5 ring-1 ring-[#0D1F3C]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requesterType"
                      value={opt.value}
                      checked={requesterType === opt.value}
                      onChange={(e) => setRequesterType(e.target.value)}
                      className="accent-[#0D1F3C]"
                    />
                    <span className="text-base text-gray-900">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-900 mb-1.5">
                Patient full name <span className="text-red-500">*</span>
              </label>
              <input
                id="patientName"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition"
                placeholder="Full legal name"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-1.5">
                Patient date of birth <span className="text-red-500">*</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-900 mb-1.5">
                Contact email <span className="text-red-500">*</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-900 mb-1.5">
                Contact phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition"
                placeholder="+234..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-6 py-3 bg-[#0D1F3C] text-white text-base font-semibold rounded-xl hover:bg-[#162d52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Clinical details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select specialty <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setSelectedSpecialty(s.name);
                      setCustomCondition('');
                    }}
                    className={`text-left border rounded-xl p-3.5 transition-colors ${
                      selectedSpecialty === s.name
                        ? 'border-[#0D1F3C] bg-[#0D1F3C]/5 ring-1 ring-[#0D1F3C]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900">{s.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{s.scope}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="customCondition" className="block text-sm font-medium text-gray-900 mb-1.5">
                Or describe your condition if not listed
              </label>
              <input
                id="customCondition"
                type="text"
                value={customCondition}
                onChange={(e) => {
                  setCustomCondition(e.target.value);
                  if (e.target.value.trim()) setSelectedSpecialty('');
                }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition"
                placeholder="e.g. Paediatric cardiac condition"
              />
            </div>

            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-900 mb-1.5">
                Current diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition resize-y"
                placeholder="Describe the diagnosis you have received, including relevant history and test results."
              />
              {diagnosis.length >= 30 && (
                <button
                  type="button"
                  onClick={checkSpecialty}
                  disabled={aiLoading}
                  className="mt-2 px-4 py-2 bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  ) : (
                    'Suggest specialty'
                  )}
                </button>
              )}
              {aiSuggestion && (
                <div className="mt-3 border border-[#0A4A50]/30 bg-[#0A4A50]/5 rounded-xl p-4">
                  <p className="text-sm text-[#0A4A50] font-medium">
                    Suggested:{' '}
                    <span className="font-bold">{aiSuggestion.specialty}</span>{' '}
                    <span className="text-gray-500">({aiSuggestion.confidence} confidence)</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{aiSuggestion.reasoning}</p>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    AI suggestion — review before accepting.
                  </p>
                  {selectedSpecialty !== aiSuggestion.specialty && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSpecialty(aiSuggestion.specialty);
                        setCustomCondition('');
                      }}
                      className="mt-2 px-3 py-1.5 bg-[#0A4A50] text-white text-sm rounded-lg hover:bg-[#0A4A50]/80 transition-colors cursor-pointer"
                    >
                      Use this suggestion
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="proposedTreatment" className="block text-sm font-medium text-gray-900 mb-1.5">
                Proposed treatment or procedure <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="proposedTreatment"
                value={proposedTreatment}
                onChange={(e) => setProposedTreatment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition resize-y"
                placeholder="What treatment or surgery has been recommended?"
              />
            </div>

            <div>
              <label htmlFor="specificQuestions" className="block text-sm font-medium text-gray-900 mb-1.5">
                Specific questions for the specialist <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="specificQuestions"
                value={specificQuestions}
                onChange={(e) => setSpecificQuestions(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0D1F3C]/20 focus:border-[#0D1F3C] outline-none transition resize-y"
                placeholder="e.g. Do you agree with the diagnosis? Is surgery necessary at this stage?"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="px-6 py-3 bg-[#0D1F3C] text-white text-base font-semibold rounded-xl hover:bg-[#162d52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Service tier & documents */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select service tier <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTier(t.id)}
                    className={`text-left border rounded-xl p-4 transition-colors ${
                      selectedTier === t.id
                        ? 'border-[#0D1F3C] bg-[#0D1F3C]/5 ring-1 ring-[#0D1F3C]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className="block text-xl font-bold text-[#0D1F3C] mt-1">
                      {'\u20A6'}{t.price}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">{t.turnaround}</span>
                    <span className="block text-xs text-gray-500">{t.deliverable}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Supporting documents
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
                }}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.dcm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) handleFileUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, images, DICOM, Word documents. Max 20MB each.
                    </p>
                  </>
                )}
              </div>

              {/* Uploaded files list */}
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">{doc.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {(doc.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDocument(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentShare}
                  onChange={(e) => setConsentShare(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#0D1F3C] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I consent to my documents being shared with the assigned reviewing specialist.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentNotEmergency}
                  onChange={(e) => setConsentNotEmergency(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#0D1F3C] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I understand this is not an emergency service. If I am experiencing a medical emergency, I will call 112 or visit the nearest emergency department.
                </span>
              </label>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-base font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="px-6 py-3 bg-[#0D1F3C] text-white text-base font-semibold rounded-xl hover:bg-[#162d52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </span>
                ) : (
                  'Submit request'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
