/**
 * MECE list of medical specialties used across the platform.
 * Alphabetically sorted. Update this single file to change everywhere.
 */
export const SPECIALTIES = [
  "Anaesthesia & Critical Care",
  "Cardiology",
  "Cardiothoracic Surgery",
  "Clinical Pharmacology",
  "Dentistry & Oral Surgery",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology & Diabetes",
  "ENT (Otorhinolaryngology)",
  "Family Medicine / General Practice",
  "Finance",
  "Gastroenterology",
  "General Surgery",
  "Geriatric Medicine",
  "Haematology",
  "Infectious Diseases",
  "Internal Medicine",
  "Management Consulting",
  "Maxillofacial Surgery",
  "Neonatology",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Obstetrics & Gynaecology",
  "Occupational Medicine",
  "Oncology",
  "Ophthalmology",
  "Oral & Maxillofacial Surgery",
  "Orthopaedic Surgery",
  "Paediatric Surgery",
  "Paediatrics",
  "Palliative Medicine",
  "Pathology",
  "Physiotherapy / Physical Therapy",
  "Plastic & Reconstructive Surgery",
  "Psychiatry",
  "Public Health",
  "Pulmonology / Respiratory Medicine",
  "Radiology",
  "Rehabilitation Medicine",
  "Rheumatology",
  "Sports Medicine",
  "Trauma Surgery",
  "Urology",
  "Vascular Surgery",
  "Other",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

/**
 * Normalise a specialty name for comparison.
 * Handles case, punctuation, spacing and British/American spellings
 * ("Paediatrics" vs "Pediatrics", "Haematology" vs "Hematology").
 */
export function normalizeSpecialtyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ae|oe/g, "e")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Suggested sub-specialties, offered as autocomplete rather than a fixed
 * choice: the field stays free text so nobody is ever blocked by an omission,
 * which is how physiotherapists ended up filing themselves under "Other" and
 * "Rehabilitation Medicine".
 *
 * The physiotherapy list came from a practising member. Extend the rest the
 * same way, from members who hold the specialty, rather than by guesswork.
 */
export const SUB_SPECIALTIES: Partial<Record<Specialty, readonly string[]>> = {
  "Physiotherapy / Physical Therapy": [
    "General Physiotherapy",
    "Neurological Physiotherapy",
    "Orthopaedic Manual Physical Therapy (OMPT)",
    "Sports Physiotherapy",
    "Rehabilitation Specialist Physiotherapy",
    "Functional Capacity Evaluation",
    "Home Healthcare Physiotherapy",
    "Paediatric Physiotherapy",
    "Cardiorespiratory Physiotherapy",
    "Women's Health Physiotherapy",
    "Geriatric Physiotherapy",
  ],
  Cardiology: [
    "Interventional Cardiology",
    "Electrophysiology",
    "Heart Failure",
    "Echocardiography / Cardiac Imaging",
    "Paediatric Cardiology",
    "Preventive Cardiology",
  ],
  Paediatrics: [
    "Neonatology",
    "Developmental Paediatrics",
    "Paediatric Cardiology",
    "Paediatric Neurology",
    "Paediatric Critical Care",
    "Paediatric Infectious Diseases",
    "Paediatric Oncology",
  ],
  Psychiatry: [
    "Child & Adolescent Psychiatry",
    "Old Age Psychiatry",
    "Addiction & Substance Use Disorder",
    "Forensic Psychiatry",
    "Liaison Psychiatry",
    "General Adult Psychiatry",
  ],
  "Internal Medicine": [
    "Acute Internal Medicine",
    "Infectious Diseases",
    "Respiratory Medicine",
    "Endocrinology",
    "Gastroenterology",
    "Nephrology",
  ],
  "General Surgery": [
    "Breast Surgery",
    "Colorectal Surgery",
    "Upper GI & Hepatobiliary Surgery",
    "Endocrine Surgery",
    "Laparoscopic / Minimal Access Surgery",
  ],
  Neurosurgery: [
    "General Neurosurgery",
    "Skull Base Surgery",
    "Vascular Neurosurgery",
    "Spinal Neurosurgery",
    "Paediatric Neurosurgery",
    "Functional Neurosurgery",
  ],
  "Obstetrics & Gynaecology": [
    "Maternal & Fetal Medicine",
    "Reproductive Medicine & IVF",
    "Gynaecological Oncology",
    "Urogynaecology",
    "Minimal Access Gynaecology",
  ],
  "Rehabilitation Medicine": [
    "Neurorehabilitation",
    "Musculoskeletal Rehabilitation",
    "Spinal Cord Injury Rehabilitation",
    "Prosthetics & Orthotics",
    "Pain Management",
  ],
  "Cardiothoracic Surgery": [
    "Adult Cardiac Surgery",
    "Thoracic Surgery",
    "Congenital Cardiac Surgery",
  ],
  "Public Health": [
    "Epidemiology",
    "Health Policy & Systems",
    "Global Health",
    "Health Promotion",
    "Occupational Health",
  ],
  "Emergency Medicine": [
    "Pre-hospital & Retrieval Medicine",
    "Paediatric Emergency Medicine",
    "Trauma",
    "Toxicology",
  ],
};

/** Suggestions for a specialty, empty when we have none on record yet. */
export function subSpecialtiesFor(specialty: string): readonly string[] {
  return SUB_SPECIALTIES[specialty as Specialty] ?? [];
}
