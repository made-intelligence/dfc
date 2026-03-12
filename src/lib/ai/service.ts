import 'server-only';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export async function callClaude(system: string, user: string, maxTokens = 1000): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export const SPECIALTIES = [
  'Cardiothoracic Surgery',
  'Neurosurgery',
  'Orthopaedic Surgery',
  'Oncology',
  'Nephrology',
  'Gastroenterology',
  'Haematology',
  'Endocrinology',
  'Urology',
  'Paediatric Surgery',
  'Vascular Surgery',
  'General Surgery',
  'Internal Medicine',
  'Obstetrics & Gynaecology',
  'Psychiatry',
  'Paediatrics',
  'Dermatology',
  'Ophthalmology',
  'ENT Surgery',
  'Radiology',
  'Anaesthesia',
  'Emergency Medicine',
] as const;

export async function routeSpecialty(description: string) {
  const system = `You are a clinical triage assistant. Given a patient's description, identify the most appropriate medical specialty. Available specialties: ${SPECIALTIES.join(', ')}. Respond ONLY with valid JSON, no markdown.`;
  const prompt = `Patient description: "${description}"\n\nReturn: { "primary": "<specialty>", "secondary": "<specialty or null>", "confidence": "high|medium|low", "reasoning": "<one sentence>" }`;
  try {
    const raw = await callClaude(system, prompt, 300);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {
      primary: 'General Surgery',
      secondary: null,
      confidence: 'low',
      reasoning: 'Could not determine automatically.',
    };
  }
}

export interface CaseData {
  patientName: string;
  dob?: string;
  diagnosis: string;
  proposedTreatment?: string;
  specificQuestions?: string;
  specialty: string;
}

export async function summariseCaseForSpecialist(data: CaseData): Promise<string> {
  const system = `You are a clinical case preparation assistant. Write a structured clinical brief for a specialist second opinion. Be accurate and concise. Do not diagnose. Do not invent clinical details.`;
  const prompt = `Prepare a brief for a ${data.specialty} specialist.\n\nPatient: ${data.patientName}${data.dob ? `, DOB: ${data.dob}` : ''}\nDiagnosis: ${data.diagnosis}\nProposed treatment: ${data.proposedTreatment || 'Not specified'}\nPatient questions: ${data.specificQuestions || 'None'}\n\nStructure: 1. CASE SUMMARY 2. CLINICAL QUESTION 3. PATIENT QUESTIONS 4. NOTES FOR SPECIALIST`;
  return callClaude(system, prompt, 1000);
}

export async function generateClinicalSummary(data: {
  patientName: string;
  age: number;
  allergies: string[];
  problemList: string[];
  currentMedications: string[];
  latestVitals: Record<string, string>;
  recentEncounters: Array<{ date: string; chiefComplaint: string; assessment: string }>;
}): Promise<string> {
  const system = `You are a clinical documentation assistant. Generate a concise, structured
clinical summary for physician use. Use standard medical terminology. Do not diagnose.
Do not invent clinical data. Summarise only what is provided.`;

  const prompt = `Generate a clinical summary for:
Patient: ${data.patientName}, Age: ${data.age}
Allergies: ${data.allergies.join(', ') || 'None known'}
Active problems: ${data.problemList.join(', ') || 'None recorded'}
Current medications: ${data.currentMedications.join(', ') || 'None'}
Latest vitals: ${JSON.stringify(data.latestVitals)}
Recent encounters: ${data.recentEncounters.map(e => `${e.date}: ${e.chiefComplaint} — ${e.assessment}`).join('\n')}

Format: 1-2 paragraph clinical overview suitable for a handover or referral letter header.`;

  return callClaude(system, prompt, 600);
}

export async function classifySecretariatRequest(message: string) {
  const types =
    'LICENCE_RENEWAL|LETTER_GOOD_STANDING|MEMBERSHIP_CERTIFICATE|RECOMMENDATION_LETTER|DUES_QUERY|MEMBERSHIP_QUERY|SECOND_OPINION_QUERY|APPOINTMENT_QUERY|GENERAL_ENQUIRY';
  const system = `You are a classification assistant for the DFC Secretariat. Respond ONLY with valid JSON, no markdown.`;
  const prompt = `Message: "${message}"\n\nReturn: { "type": "<${types}>", "priority": "HIGH|NORMAL|LOW", "suggestedAction": "<one sentence>", "draftReply": "<2-3 sentence acknowledgement>" }`;
  try {
    const raw = await callClaude(system, prompt, 400);
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {
      type: 'GENERAL_ENQUIRY',
      priority: 'NORMAL',
      suggestedAction: 'Review manually.',
      draftReply:
        'Thank you for contacting the DFC Secretariat. We will be in touch shortly.',
    };
  }
}
