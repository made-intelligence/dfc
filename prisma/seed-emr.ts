import { PrismaClient, CDSSAlertLevel, CDSSAlertStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Seeding EMR & CDSS test data...\n');

  // ── Get existing users ──────────────────────────────────────────────
  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true },
    take: 4,
  });
  const patients = await prisma.patientProfile.findMany({
    include: { user: true },
    take: 4,
  });

  if (doctors.length === 0 || patients.length === 0) {
    console.error('❌ No doctors or patients found. Run `npx tsx prisma/seed.ts` first.');
    process.exit(1);
  }

  const dr1 = doctors[0]; // Cardiologist
  const dr2 = doctors[1]; // Neurologist
  const dr3 = doctors[2]; // Pediatrician
  const patient1 = patients[0]; // John Doe
  const patient2 = patients[1]; // Jane Smith
  const patient3 = patients[2]; // Mike Wilson

  console.log(`  Doctors: ${doctors.map(d => d.user.name).join(', ')}`);
  console.log(`  Patients: ${patients.map(p => p.user.name).join(', ')}\n`);

  // ── Clean EMR data (order matters for FK constraints) ───────────────
  await prisma.cDSSInteractionLog.deleteMany();
  await prisma.cDSSAlert.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.investigationOrder.deleteMany();
  await prisma.encounterReferral.deleteMany();
  await prisma.clinicalDocument.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.patientMedication.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.patientProblem.deleteMany();
  await prisma.familyHistoryEntry.deleteMany();
  await prisma.patientConsent.deleteMany();
  await prisma.recordAccessLog.deleteMany();
  await prisma.recordAccessGrant.deleteMany();
  await prisma.clinicalEncounter.deleteMany();
  console.log('🧹 Cleaned existing EMR data');

  // ── Update patient profiles with richer demographics ────────────────
  await prisma.patientProfile.update({
    where: { id: patient1.id },
    data: {
      dateOfBirth: new Date('1985-03-12'),
      gender: 'male',
      bloodGroup: 'O+',
      nationality: 'Nigerian',
      occupation: 'Software Engineer',
      maritalStatus: 'Married',
      nhisNumber: 'NHIS-2024-00451',
      hmoName: 'Leadway Health',
      nextOfKinName: 'Mary Doe',
      nextOfKinPhone: '+234 812 345 6789',
      nextOfKinRelation: 'Spouse',
    },
  });
  await prisma.patientProfile.update({
    where: { id: patient2.id },
    data: {
      dateOfBirth: new Date('1992-07-20'),
      gender: 'female',
      bloodGroup: 'A+',
      nationality: 'Nigerian',
      occupation: 'Accountant',
      maritalStatus: 'Single',
      nhisNumber: 'NHIS-2024-00887',
      hmoName: 'HMO Health Plus',
    },
  });
  await prisma.patientProfile.update({
    where: { id: patient3.id },
    data: {
      dateOfBirth: new Date('1978-11-05'),
      gender: 'male',
      bloodGroup: 'B+',
      nationality: 'Nigerian',
      occupation: 'Teacher',
      maritalStatus: 'Married',
    },
  });
  console.log('✅ Updated patient demographics');

  // ── Encounters ──────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);

  // Patient 1: 3 encounters with Dr1 (cardiologist)
  const enc1 = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient1.id,
      doctorId: dr1.id,
      encounterType: 'CONSULTATION',
      encounterDate: daysAgo(30),
      chiefComplaint: 'Chest pain radiating to left arm, worse on exertion',
      subjective: 'Patient reports intermittent chest pain for 2 weeks, radiating to left arm. Pain worsens with physical activity and resolves with rest. Associated with mild shortness of breath. No syncope. Positive family history of MI (father at age 55).',
      objective: 'BP: 150/95 mmHg. HR: 88 bpm regular. BMI: 29.3. Heart sounds S1S2 normal, no murmurs. Lungs clear. No peripheral edema. JVP not raised.',
      assessment: 'Unstable angina — high risk given family history and hypertension. Rule out acute coronary syndrome.',
      plan: '1. ECG and Troponin I stat\n2. Lipid profile, FBS, HbA1c\n3. Start Aspirin 75mg OD\n4. Atorvastatin 40mg nocte\n5. GTN SL PRN for chest pain\n6. Cardiology review in 2 weeks\n7. Lifestyle counseling — weight loss, reduce salt intake',
      primaryDiagnosis: 'I20.0 — Unstable angina',
      secondaryDiagnoses: JSON.stringify(['I10 — Essential hypertension', 'E66.0 — Obesity']),
      status: 'SIGNED',
      signedAt: daysAgo(30),
      signedById: dr1.id,
    },
  });

  const enc2 = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient1.id,
      doctorId: dr1.id,
      encounterType: 'FOLLOW_UP',
      encounterDate: daysAgo(14),
      chiefComplaint: 'Follow-up for chest pain — improved',
      subjective: 'Chest pain significantly reduced. Only one episode in past 2 weeks, mild, resolved with rest. No GTN needed. Tolerating medications well. Started walking 30 mins daily.',
      objective: 'BP: 138/88 mmHg (improved). HR: 76 bpm. Weight: 89kg (was 92kg). ECG: Normal sinus rhythm. Troponin I: negative.',
      assessment: 'Stable angina, well controlled on current medication. Hypertension improving.',
      plan: '1. Continue current medications\n2. Stress test in 4 weeks\n3. Review lipid panel results\n4. Encourage continued exercise\n5. Follow-up in 4 weeks',
      primaryDiagnosis: 'I20.9 — Angina pectoris, unspecified',
      status: 'SIGNED',
      signedAt: daysAgo(14),
      signedById: dr1.id,
    },
  });

  const enc3 = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient1.id,
      doctorId: dr1.id,
      encounterType: 'FOLLOW_UP',
      encounterDate: daysAgo(1),
      chiefComplaint: 'Routine follow-up — stress test results review',
      subjective: 'No chest pain for 3 weeks. Feeling well. Walking 45 mins daily. Lost 4kg total.',
      objective: 'BP: 130/82 mmHg. HR: 72 bpm. Weight: 88kg. Stress test: Duke score +5 (low risk). Lipid panel: TC 4.8, LDL 2.4, HDL 1.2, TG 1.6.',
      assessment: 'Angina well controlled. Low cardiovascular risk on stress testing. Lipids at target on statin.',
      plan: '1. Continue medications\n2. 6-monthly follow-up\n3. Annual echocardiogram\n4. Maintain exercise regime',
      primaryDiagnosis: 'I20.9 — Angina pectoris, unspecified',
      status: 'DRAFT',
      followUpDate: new Date(now.getTime() + 180 * 86400000),
      followUpNotes: 'Review BP and lipids. Consider reducing antihypertensive if BP stays controlled.',
    },
  });

  // Patient 2: 2 encounters with Dr2 (neurologist)
  const enc4 = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient2.id,
      doctorId: dr2.id,
      encounterType: 'CONSULTATION',
      encounterDate: daysAgo(7),
      chiefComplaint: 'Recurrent migraine with aura, increasing frequency',
      subjective: 'Reports 4-5 migraines per month for the past 3 months, up from 1-2/month. Visual aura (zigzag lines) precedes headache by 20-30 mins. Pain is unilateral, throbbing, rated 8/10. Associated with nausea, photophobia, phonophobia. Lasts 12-24 hours. OCP use for 2 years. No recent head trauma.',
      objective: 'Neurological exam normal. Cranial nerves intact. Visual fields full. Fundoscopy normal. No focal deficits. BP 118/72.',
      assessment: 'Migraine with aura — increasing frequency warrants prophylaxis. OCP use with aura raises stroke risk.',
      plan: '1. Start Propranolol 40mg BD for prophylaxis\n2. Sumatriptan 50mg PRN for acute attacks (max 2/week)\n3. MRI brain to rule out structural cause\n4. Advise OCP discontinuation — refer to gynaecology for alternative contraception\n5. Headache diary\n6. Review in 6 weeks',
      primaryDiagnosis: 'G43.1 — Migraine with aura',
      status: 'SIGNED',
      signedAt: daysAgo(7),
      signedById: dr2.id,
    },
  });

  const enc5 = await prisma.clinicalEncounter.create({
    data: {
      patientId: patient3.id,
      doctorId: dr1.id,
      encounterType: 'EMERGENCY',
      encounterDate: daysAgo(3),
      chiefComplaint: 'Severe chest tightness and breathlessness',
      subjective: 'Sudden onset chest tightness and breathlessness at 3 AM. No trauma. History of hypertension, non-compliant with medications. Smoker — 1 pack/day x 20 years. No previous cardiac events.',
      objective: 'BP: 180/110 mmHg. HR: 105 bpm, irregular. SpO2: 93% on room air. JVP raised. Bilateral fine crackles lower zones. S3 gallop heard. Bilateral pedal edema.',
      assessment: 'Acute decompensated heart failure, likely hypertensive heart disease. AF with rapid ventricular response.',
      plan: '1. IV Furosemide 40mg stat\n2. O2 via nasal cannula 3L/min\n3. Urgent troponin, BNP, CXR, ECG\n4. Restrict fluids to 1.5L/day\n5. Start Bisoprolol 2.5mg OD for rate control\n6. Echocardiogram urgently\n7. Admit for monitoring',
      primaryDiagnosis: 'I50.1 — Left ventricular failure',
      secondaryDiagnoses: JSON.stringify(['I48.0 — Atrial fibrillation', 'I11.0 — Hypertensive heart disease with heart failure']),
      status: 'SIGNED',
      signedAt: daysAgo(3),
      signedById: dr1.id,
      isConfidential: false,
    },
  });

  console.log('✅ Created 5 clinical encounters');

  // ── Vital Signs ─────────────────────────────────────────────────────
  const vitalsData = [
    // Patient 1 — encounter 1
    { patientId: patient1.id, encounterId: enc1.id, recordedById: dr1.id, recordedAt: daysAgo(30), systolicBP: 150, diastolicBP: 95, heartRate: 88, respiratoryRate: 18, temperature: 36.8, oxygenSat: 98.0, weight: 92.0, height: 177.0, bmi: 29.3, bloodGlucose: 6.2 },
    // Patient 1 — encounter 2
    { patientId: patient1.id, encounterId: enc2.id, recordedById: dr1.id, recordedAt: daysAgo(14), systolicBP: 138, diastolicBP: 88, heartRate: 76, respiratoryRate: 16, temperature: 36.6, oxygenSat: 99.0, weight: 89.0, height: 177.0, bmi: 28.4, bloodGlucose: 5.8 },
    // Patient 1 — encounter 3
    { patientId: patient1.id, encounterId: enc3.id, recordedById: dr1.id, recordedAt: daysAgo(1), systolicBP: 130, diastolicBP: 82, heartRate: 72, respiratoryRate: 16, temperature: 36.5, oxygenSat: 99.0, weight: 88.0, height: 177.0, bmi: 28.1 },
    // Patient 2 — encounter 4
    { patientId: patient2.id, encounterId: enc4.id, recordedById: dr2.id, recordedAt: daysAgo(7), systolicBP: 118, diastolicBP: 72, heartRate: 68, respiratoryRate: 14, temperature: 36.7, oxygenSat: 99.0, weight: 62.0, height: 165.0, bmi: 22.8 },
    // Patient 3 — encounter 5 (emergency — abnormal vitals)
    { patientId: patient3.id, encounterId: enc5.id, recordedById: dr1.id, recordedAt: daysAgo(3), systolicBP: 180, diastolicBP: 110, heartRate: 105, respiratoryRate: 28, temperature: 37.1, oxygenSat: 93.0, weight: 95.0, height: 175.0, bmi: 31.0, bloodGlucose: 8.5 },
  ];

  for (const v of vitalsData) {
    await prisma.vitalSign.create({ data: v });
  }
  console.log('✅ Created 5 vital sign records');

  // ── Problem Lists ───────────────────────────────────────────────────
  const problems = [
    // Patient 1
    { patientId: patient1.id, addedById: dr1.id, problem: 'Essential Hypertension', icdCode: 'I10', status: 'ACTIVE', onsetDate: daysAgo(365) },
    { patientId: patient1.id, addedById: dr1.id, problem: 'Unstable Angina', icdCode: 'I20.0', status: 'ACTIVE', onsetDate: daysAgo(30) },
    { patientId: patient1.id, addedById: dr1.id, problem: 'Obesity', icdCode: 'E66.0', status: 'ACTIVE', onsetDate: daysAgo(365) },
    { patientId: patient1.id, addedById: dr1.id, problem: 'Hyperlipidemia', icdCode: 'E78.5', status: 'ACTIVE', onsetDate: daysAgo(30) },
    // Patient 2
    { patientId: patient2.id, addedById: dr2.id, problem: 'Migraine with aura', icdCode: 'G43.1', status: 'ACTIVE', onsetDate: daysAgo(180) },
    { patientId: patient2.id, addedById: dr2.id, problem: 'Allergic rhinitis', icdCode: 'J30.4', status: 'ACTIVE', onsetDate: daysAgo(730) },
    // Patient 3
    { patientId: patient3.id, addedById: dr1.id, problem: 'Hypertensive heart disease with heart failure', icdCode: 'I11.0', status: 'ACTIVE', onsetDate: daysAgo(3) },
    { patientId: patient3.id, addedById: dr1.id, problem: 'Atrial fibrillation', icdCode: 'I48.0', status: 'ACTIVE', onsetDate: daysAgo(3) },
    { patientId: patient3.id, addedById: dr1.id, problem: 'Type 2 Diabetes Mellitus', icdCode: 'E11.9', status: 'ACTIVE', onsetDate: daysAgo(1825), notes: 'Previously undiagnosed, FBS 8.5 on admission' },
  ];

  for (const p of problems) {
    await prisma.patientProblem.create({ data: p });
  }
  console.log('✅ Created 9 problem list entries');

  // ── Allergies ───────────────────────────────────────────────────────
  const allergies = [
    // Patient 1 — CRITICAL allergy (will trigger AllergyBanner)
    { patientId: patient1.id, addedById: dr1.id, allergen: 'Penicillin', allergyType: 'DRUG', reaction: 'Anaphylaxis — throat swelling, hypotension', severity: 'LIFE_THREATENING', status: 'ACTIVE' },
    { patientId: patient1.id, addedById: dr1.id, allergen: 'Sulfonamides', allergyType: 'DRUG', reaction: 'Stevens-Johnson Syndrome', severity: 'SEVERE', status: 'ACTIVE' },
    { patientId: patient1.id, addedById: dr1.id, allergen: 'Peanuts', allergyType: 'FOOD', reaction: 'Urticaria and lip swelling', severity: 'MODERATE', status: 'ACTIVE' },
    // Patient 2
    { patientId: patient2.id, addedById: dr2.id, allergen: 'Ibuprofen', allergyType: 'DRUG', reaction: 'Bronchospasm', severity: 'SEVERE', status: 'ACTIVE' },
    { patientId: patient2.id, addedById: dr2.id, allergen: 'Dust mites', allergyType: 'ENVIRONMENTAL', reaction: 'Sneezing, rhinorrhea', severity: 'MILD', status: 'ACTIVE' },
    // Patient 3
    { patientId: patient3.id, addedById: dr1.id, allergen: 'ACE Inhibitors', allergyType: 'DRUG', reaction: 'Angioedema', severity: 'SEVERE', status: 'ACTIVE', notes: 'Developed facial swelling with Ramipril — use ARBs instead' },
  ];

  for (const a of allergies) {
    await prisma.patientAllergy.create({ data: a });
  }
  console.log('✅ Created 6 allergy records');

  // ── Medications ─────────────────────────────────────────────────────
  const medications = [
    // Patient 1 — cardiac meds
    { patientId: patient1.id, prescribedById: dr1.id, drugName: 'Aspirin', dose: '75mg', frequency: 'Once daily', route: 'PO', indication: 'Antiplatelet for unstable angina', status: 'ACTIVE', startDate: daysAgo(30) },
    { patientId: patient1.id, prescribedById: dr1.id, drugName: 'Atorvastatin', dose: '40mg', frequency: 'Once daily at night', route: 'PO', indication: 'Hyperlipidemia', status: 'ACTIVE', startDate: daysAgo(30) },
    { patientId: patient1.id, prescribedById: dr1.id, drugName: 'Amlodipine', dose: '10mg', frequency: 'Once daily', route: 'PO', indication: 'Hypertension', status: 'ACTIVE', startDate: daysAgo(365) },
    { patientId: patient1.id, prescribedById: dr1.id, drugName: 'GTN Sublingual', dose: '0.5mg', frequency: 'PRN for chest pain', route: 'SL', indication: 'Acute angina relief', status: 'ACTIVE', startDate: daysAgo(30) },
    // Patient 2 — migraine
    { patientId: patient2.id, prescribedById: dr2.id, drugName: 'Propranolol', dose: '40mg', frequency: 'Twice daily', route: 'PO', indication: 'Migraine prophylaxis', status: 'ACTIVE', startDate: daysAgo(7) },
    { patientId: patient2.id, prescribedById: dr2.id, drugName: 'Sumatriptan', dose: '50mg', frequency: 'PRN (max 2/week)', route: 'PO', indication: 'Acute migraine', status: 'ACTIVE', startDate: daysAgo(7) },
    // Patient 3 — heart failure + AF
    { patientId: patient3.id, prescribedById: dr1.id, drugName: 'Furosemide', dose: '40mg', frequency: 'Twice daily', route: 'PO', indication: 'Heart failure', status: 'ACTIVE', startDate: daysAgo(3) },
    { patientId: patient3.id, prescribedById: dr1.id, drugName: 'Bisoprolol', dose: '2.5mg', frequency: 'Once daily', route: 'PO', indication: 'AF rate control', status: 'ACTIVE', startDate: daysAgo(3) },
    { patientId: patient3.id, prescribedById: dr1.id, drugName: 'Losartan', dose: '50mg', frequency: 'Once daily', route: 'PO', indication: 'Heart failure + hypertension (ACE-I intolerant)', status: 'ACTIVE', startDate: daysAgo(3) },
    { patientId: patient3.id, prescribedById: dr1.id, drugName: 'Warfarin', dose: '5mg', frequency: 'Once daily', route: 'PO', indication: 'AF anticoagulation', status: 'ACTIVE', startDate: daysAgo(2), notes: 'Target INR 2-3. Check INR weekly.' },
    // Discontinued med
    { patientId: patient3.id, prescribedById: dr1.id, drugName: 'Ramipril', dose: '5mg', frequency: 'Once daily', route: 'PO', indication: 'Heart failure', status: 'DISCONTINUED', startDate: daysAgo(3), endDate: daysAgo(2), discontinuedReason: 'Angioedema — switched to Losartan' },
  ];

  for (const m of medications) {
    await prisma.patientMedication.create({ data: m });
  }
  console.log('✅ Created 11 medication records');

  // ── Prescriptions ───────────────────────────────────────────────────
  const rx1 = await prisma.prescription.create({
    data: {
      encounterId: enc1.id,
      patientId: patient1.id,
      prescribedById: dr1.id,
      rxNumber: 'DFC-RX-2026-0001',
      status: 'DISPENSED',
      dispensedAt: daysAgo(29),
      expiresAt: new Date(now.getTime() + 60 * 86400000),
      items: {
        create: [
          { drugName: 'Aspirin', dose: '75mg', form: 'Tablet', route: 'PO', frequency: 'Once daily', duration: '90 days', quantity: '90 tablets', instructions: 'Take after breakfast' },
          { drugName: 'Atorvastatin', dose: '40mg', form: 'Tablet', route: 'PO', frequency: 'Once daily at night', duration: '90 days', quantity: '90 tablets', instructions: 'Take at bedtime' },
          { drugName: 'GTN', dose: '0.5mg', form: 'Sublingual tablet', route: 'SL', frequency: 'PRN', duration: 'As needed', quantity: '30 tablets', instructions: 'Place under tongue for chest pain. If no relief in 5 mins, take another. Seek emergency care if pain persists after 3 doses.' },
        ],
      },
    },
  });

  const rx2 = await prisma.prescription.create({
    data: {
      encounterId: enc4.id,
      patientId: patient2.id,
      prescribedById: dr2.id,
      rxNumber: 'DFC-RX-2026-0002',
      status: 'ACTIVE',
      expiresAt: new Date(now.getTime() + 90 * 86400000),
      items: {
        create: [
          { drugName: 'Propranolol', dose: '40mg', form: 'Tablet', route: 'PO', frequency: 'Twice daily', duration: '6 weeks', quantity: '84 tablets', instructions: 'Take morning and evening. Do not stop abruptly.' },
          { drugName: 'Sumatriptan', dose: '50mg', form: 'Tablet', route: 'PO', frequency: 'PRN (max 2/week)', duration: 'As needed', quantity: '8 tablets', instructions: 'Take at onset of migraine. May repeat after 2 hours if needed. Max 2 tablets per day.' },
        ],
      },
    },
  });

  const rx3 = await prisma.prescription.create({
    data: {
      encounterId: enc5.id,
      patientId: patient3.id,
      prescribedById: dr1.id,
      rxNumber: 'DFC-RX-2026-0003',
      status: 'ACTIVE',
      expiresAt: new Date(now.getTime() + 30 * 86400000),
      items: {
        create: [
          { drugName: 'Furosemide', dose: '40mg', form: 'Tablet', route: 'PO', frequency: 'Twice daily', duration: '30 days', quantity: '60 tablets', instructions: 'Take morning and afternoon. Monitor daily weight.' },
          { drugName: 'Bisoprolol', dose: '2.5mg', form: 'Tablet', route: 'PO', frequency: 'Once daily', duration: '30 days', quantity: '30 tablets', instructions: 'Take in the morning. Do not stop abruptly.' },
          { drugName: 'Losartan', dose: '50mg', form: 'Tablet', route: 'PO', frequency: 'Once daily', duration: '30 days', quantity: '30 tablets', instructions: 'Take in the morning.' },
          { drugName: 'Warfarin', dose: '5mg', form: 'Tablet', route: 'PO', frequency: 'Once daily', duration: '30 days', quantity: '30 tablets', instructions: 'Take at the same time daily. Regular INR monitoring required.' },
        ],
      },
    },
  });

  console.log('✅ Created 3 prescriptions with items');

  // ── Investigation Orders + Lab Results ──────────────────────────────
  const inv1 = await prisma.investigationOrder.create({
    data: {
      encounterId: enc1.id,
      patientId: patient1.id,
      orderedById: dr1.id,
      type: 'LAB',
      name: 'Troponin I',
      urgency: 'STAT',
      status: 'RESULTED',
      resultedAt: daysAgo(30),
    },
  });

  await prisma.labResult.create({
    data: {
      patientId: patient1.id,
      investigationId: inv1.id,
      uploadedById: dr1.id,
      testName: 'Troponin I',
      labName: 'DFC Core Lab',
      reportDate: daysAgo(30),
      results: JSON.stringify([
        { test: 'Troponin I', value: '0.02', unit: 'ng/mL', refRange: '<0.04', flag: 'NORMAL' },
      ]),
      interpretation: 'Troponin I within normal limits. No evidence of myocardial infarction.',
      isAbnormal: false,
      reviewedById: dr1.id,
      reviewedAt: daysAgo(30),
    },
  });

  const inv2 = await prisma.investigationOrder.create({
    data: {
      encounterId: enc1.id,
      patientId: patient1.id,
      orderedById: dr1.id,
      type: 'LAB',
      name: 'Lipid Profile',
      urgency: 'ROUTINE',
      status: 'RESULTED',
      resultedAt: daysAgo(28),
    },
  });

  await prisma.labResult.create({
    data: {
      patientId: patient1.id,
      investigationId: inv2.id,
      uploadedById: dr1.id,
      testName: 'Lipid Profile',
      labName: 'DFC Core Lab',
      reportDate: daysAgo(28),
      results: JSON.stringify([
        { test: 'Total Cholesterol', value: '6.8', unit: 'mmol/L', refRange: '<5.2', flag: 'HIGH' },
        { test: 'LDL', value: '4.2', unit: 'mmol/L', refRange: '<3.0', flag: 'HIGH' },
        { test: 'HDL', value: '0.9', unit: 'mmol/L', refRange: '>1.0', flag: 'LOW' },
        { test: 'Triglycerides', value: '2.4', unit: 'mmol/L', refRange: '<1.7', flag: 'HIGH' },
      ]),
      interpretation: 'Significant dyslipidemia. Elevated TC, LDL, TG with low HDL — high atherogenic risk. Statin therapy indicated.',
      isAbnormal: true,
      reviewedById: dr1.id,
      reviewedAt: daysAgo(28),
    },
  });

  const inv3 = await prisma.investigationOrder.create({
    data: {
      encounterId: enc1.id,
      patientId: patient1.id,
      orderedById: dr1.id,
      type: 'LAB',
      name: 'FBS and HbA1c',
      urgency: 'ROUTINE',
      status: 'RESULTED',
      resultedAt: daysAgo(28),
    },
  });

  await prisma.labResult.create({
    data: {
      patientId: patient1.id,
      investigationId: inv3.id,
      uploadedById: dr1.id,
      testName: 'FBS and HbA1c',
      labName: 'DFC Core Lab',
      reportDate: daysAgo(28),
      results: JSON.stringify([
        { test: 'Fasting Blood Sugar', value: '6.2', unit: 'mmol/L', refRange: '3.9-5.6', flag: 'HIGH' },
        { test: 'HbA1c', value: '6.1', unit: '%', refRange: '<5.7', flag: 'HIGH' },
      ]),
      interpretation: 'Pre-diabetic range. FBS and HbA1c both above normal. Lifestyle modification advised. Recheck in 3 months.',
      isAbnormal: true,
      reviewedById: dr1.id,
      reviewedAt: daysAgo(27),
    },
  });

  // Patient 2 — MRI brain
  await prisma.investigationOrder.create({
    data: {
      encounterId: enc4.id,
      patientId: patient2.id,
      orderedById: dr2.id,
      type: 'IMAGING',
      name: 'MRI Brain with contrast',
      instructions: 'Rule out structural lesion causing migraine. Assess for white matter changes.',
      urgency: 'ROUTINE',
      status: 'ORDERED',
    },
  });

  // Patient 3 — emergency labs
  const inv5 = await prisma.investigationOrder.create({
    data: {
      encounterId: enc5.id,
      patientId: patient3.id,
      orderedById: dr1.id,
      type: 'LAB',
      name: 'BNP and Troponin',
      urgency: 'STAT',
      status: 'RESULTED',
      resultedAt: daysAgo(3),
    },
  });

  await prisma.labResult.create({
    data: {
      patientId: patient3.id,
      investigationId: inv5.id,
      uploadedById: dr1.id,
      testName: 'BNP and Troponin',
      labName: 'DFC Core Lab',
      reportDate: daysAgo(3),
      results: JSON.stringify([
        { test: 'BNP', value: '850', unit: 'pg/mL', refRange: '<100', flag: 'CRITICAL' },
        { test: 'Troponin I', value: '0.08', unit: 'ng/mL', refRange: '<0.04', flag: 'HIGH' },
      ]),
      interpretation: 'Markedly elevated BNP consistent with heart failure. Mildly elevated troponin — myocardial strain vs demand ischemia. No acute MI pattern.',
      isAbnormal: true,
      reviewedById: dr1.id,
      reviewedAt: daysAgo(3),
    },
  });

  await prisma.investigationOrder.create({
    data: {
      encounterId: enc5.id,
      patientId: patient3.id,
      orderedById: dr1.id,
      type: 'IMAGING',
      name: 'Chest X-ray',
      urgency: 'STAT',
      status: 'RESULTED',
      resultedAt: daysAgo(3),
    },
  });

  await prisma.investigationOrder.create({
    data: {
      encounterId: enc5.id,
      patientId: patient3.id,
      orderedById: dr1.id,
      type: 'IMAGING',
      name: 'Echocardiogram',
      instructions: 'Assess LV function, wall motion, valvular disease',
      urgency: 'URGENT',
      status: 'ORDERED',
    },
  });

  console.log('✅ Created 7 investigations with 4 lab results');

  // ── Family History ──────────────────────────────────────────────────
  const familyHistory = [
    { patientId: patient1.id, addedById: dr1.id, condition: 'Myocardial Infarction', relation: 'Father', ageOfOnset: 55, deceased: true, causeOfDeath: 'Myocardial infarction' },
    { patientId: patient1.id, addedById: dr1.id, condition: 'Type 2 Diabetes', relation: 'Mother', ageOfOnset: 60 },
    { patientId: patient1.id, addedById: dr1.id, condition: 'Hypertension', relation: 'Mother', ageOfOnset: 50 },
    { patientId: patient3.id, addedById: dr1.id, condition: 'Stroke', relation: 'Father', ageOfOnset: 62, deceased: true, causeOfDeath: 'Haemorrhagic stroke' },
    { patientId: patient3.id, addedById: dr1.id, condition: 'Hypertension', relation: 'Mother', ageOfOnset: 45 },
  ];

  for (const fh of familyHistory) {
    await prisma.familyHistoryEntry.create({ data: fh });
  }
  console.log('✅ Created 5 family history entries');

  // ── Clinical Documents ──────────────────────────────────────────────
  await prisma.clinicalDocument.create({
    data: {
      patientId: patient1.id,
      encounterId: enc1.id,
      uploadedById: dr1.id,
      type: 'LAB_REPORT',
      title: 'ECG Report — Sinus Rhythm',
      description: '12-lead ECG showing normal sinus rhythm, ST depression in V4-V6',
      fileUrl: '/uploads/ecg-report-001.pdf',
      fileType: 'PDF',
      isPatientVisible: true,
    },
  });

  await prisma.clinicalDocument.create({
    data: {
      patientId: patient3.id,
      encounterId: enc5.id,
      uploadedById: dr1.id,
      type: 'IMAGING',
      title: 'CXR — Cardiomegaly with Pulmonary Congestion',
      description: 'Chest X-ray showing cardiomegaly, upper lobe pulmonary venous distension, bilateral pleural effusions',
      fileUrl: '/uploads/cxr-report-003.pdf',
      fileType: 'PDF',
      isPatientVisible: true,
    },
  });

  console.log('✅ Created 2 clinical documents');

  // ── Referrals ───────────────────────────────────────────────────────
  await prisma.encounterReferral.create({
    data: {
      encounterId: enc4.id,
      patientId: patient2.id,
      referredById: dr2.id,
      referralType: 'INTERNAL',
      specialty: 'Gynaecology',
      urgency: 'ROUTINE',
      clinicalReason: 'Migraine with aura on OCP — need alternative contraception due to increased stroke risk',
      status: 'SENT',
    },
  });

  await prisma.encounterReferral.create({
    data: {
      encounterId: enc5.id,
      patientId: patient3.id,
      referredById: dr1.id,
      referralType: 'INTERNAL',
      specialty: 'Endocrinology',
      urgency: 'ROUTINE',
      clinicalReason: 'Newly discovered pre-diabetes / diabetes (FBS 8.5) in context of acute heart failure. Needs formal assessment and management plan.',
      status: 'SENT',
    },
  });

  console.log('✅ Created 2 referrals');

  // ── Patient Consents ────────────────────────────────────────────────
  const consents = [
    { patientId: patient1.id, type: 'TREATMENT', given: true, givenAt: daysAgo(30) },
    { patientId: patient1.id, type: 'TELEMEDICINE', given: true, givenAt: daysAgo(30) },
    { patientId: patient1.id, type: 'DATA_PROCESSING', given: true, givenAt: daysAgo(30), notes: 'Consented to NDPR-compliant data processing' },
    { patientId: patient2.id, type: 'TREATMENT', given: true, givenAt: daysAgo(7) },
    { patientId: patient2.id, type: 'TELEMEDICINE', given: true, givenAt: daysAgo(7) },
    { patientId: patient3.id, type: 'TREATMENT', given: true, givenAt: daysAgo(3), witnessName: 'Nurse Adebayo' },
    // Missing consents for testing consent gaps feature
    // Patient 3 has no DATA_PROCESSING consent — should show in admin consent gap report
  ];

  for (const c of consents) {
    await prisma.patientConsent.create({ data: c });
  }
  console.log('✅ Created 6 consent records');

  // ── Record Access Grants ────────────────────────────────────────────
  // Dr1 has access to Patient 1 and Patient 3
  await prisma.recordAccessGrant.create({
    data: {
      patientId: patient1.id,
      grantedToId: dr1.id,
      scope: 'FULL',
      reason: 'Primary treating physician',
    },
  });
  await prisma.recordAccessGrant.create({
    data: {
      patientId: patient3.id,
      grantedToId: dr1.id,
      scope: 'FULL',
      reason: 'Emergency admission',
    },
  });
  // Dr2 has access to Patient 2
  await prisma.recordAccessGrant.create({
    data: {
      patientId: patient2.id,
      grantedToId: dr2.id,
      scope: 'FULL',
      reason: 'Consulting neurologist',
    },
  });
  console.log('✅ Created 3 access grants');

  // ── Record Access Logs ──────────────────────────────────────────────
  const accessLogs = [
    { patientId: patient1.id, accessedById: dr1.id, action: 'VIEWED', resourceType: 'ENCOUNTER', resourceId: enc1.id, accessedAt: daysAgo(30) },
    { patientId: patient1.id, accessedById: dr1.id, action: 'CREATED', resourceType: 'ENCOUNTER', resourceId: enc1.id, accessedAt: daysAgo(30) },
    { patientId: patient1.id, accessedById: dr1.id, action: 'VIEWED', resourceType: 'ENCOUNTER', resourceId: enc2.id, accessedAt: daysAgo(14) },
    { patientId: patient1.id, accessedById: dr1.id, action: 'UPDATED', resourceType: 'MEDICATION', accessedAt: daysAgo(14) },
    { patientId: patient2.id, accessedById: dr2.id, action: 'VIEWED', resourceType: 'FULL_RECORD', accessedAt: daysAgo(7) },
    { patientId: patient2.id, accessedById: dr2.id, action: 'CREATED', resourceType: 'ENCOUNTER', resourceId: enc4.id, accessedAt: daysAgo(7) },
    { patientId: patient3.id, accessedById: dr1.id, action: 'VIEWED', resourceType: 'FULL_RECORD', accessedAt: daysAgo(3) },
    { patientId: patient3.id, accessedById: dr1.id, action: 'CREATED', resourceType: 'ENCOUNTER', resourceId: enc5.id, accessedAt: daysAgo(3) },
  ];

  for (const log of accessLogs) {
    await prisma.recordAccessLog.create({ data: log });
  }
  console.log('✅ Created 8 access log entries');

  // ── CDSS Alerts ─────────────────────────────────────────────────────
  const cdssAlerts = [
    // Patient 1 — Drug-allergy warning (Penicillin allergy with amoxicillin prescription attempt)
    {
      patientId: patient1.id,
      encounterId: enc1.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.CRITICAL,
      status: CDSSAlertStatus.ACKNOWLEDGED,
      category: 'DRUG_ALLERGY',
      title: 'ALLERGY ALERT: Penicillin class contraindicated',
      body: 'Patient has documented LIFE-THREATENING allergy to Penicillin (anaphylaxis). Amoxicillin is a penicillin-class antibiotic and must NOT be prescribed.',
      suggestion: 'Consider Azithromycin or a fluoroquinolone if antibiotic is needed.',
      acknowledgedAt: daysAgo(30),
    },
    // Patient 1 — Drug interaction
    {
      patientId: patient1.id,
      encounterId: enc3.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.WARNING,
      status: CDSSAlertStatus.ACTIVE,
      category: 'DRUG_INTERACTION',
      title: 'Aspirin + Atorvastatin: Monitor for myopathy',
      body: 'Concurrent use of aspirin and atorvastatin may increase the risk of rhabdomyolysis, particularly at high statin doses. Current dose (40mg) is moderate risk.',
      suggestion: 'Monitor for unexplained muscle pain, tenderness, or weakness. Check CK if symptoms develop.',
    },
    // Patient 1 — Guideline reminder
    {
      patientId: patient1.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.INFO,
      status: CDSSAlertStatus.ACTIVE,
      category: 'GUIDELINE',
      title: 'Pre-diabetes: Lifestyle intervention window',
      body: 'HbA1c 6.1% (pre-diabetic range). NICE guidelines recommend structured lifestyle programme before pharmacological intervention. Recheck in 3-6 months.',
      suggestion: 'Refer to dietician. 150 mins/week moderate exercise. Target 5-7% weight loss.',
    },
    // Patient 3 — Critical lab value
    {
      patientId: patient3.id,
      encounterId: enc5.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.CRITICAL,
      status: CDSSAlertStatus.ACTIVE,
      category: 'LAB_CRITICAL',
      title: 'CRITICAL: BNP 850 pg/mL — Severe heart failure',
      body: 'BNP markedly elevated at 850 pg/mL (ref <100). Consistent with NYHA Class III-IV heart failure. Requires aggressive diuresis and specialist cardiology input.',
      suggestion: 'Consider cardiology consultation. Optimize diuretic dose. Daily weight monitoring.',
    },
    // Patient 3 — Risk score
    {
      patientId: patient3.id,
      encounterId: enc5.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.WARNING,
      status: CDSSAlertStatus.ACTIVE,
      category: 'RISK_SCORE',
      title: 'qSOFA Score: 2/3 — Elevated sepsis risk',
      body: 'Respiratory rate ≥22 (28) and systolic BP concern. qSOFA ≥2 suggests organ dysfunction. Assess for underlying infection as precipitant of heart failure decompensation.',
      suggestion: 'Consider blood cultures, CBC, CRP/PCT. Low threshold for empiric antibiotics if infection suspected.',
      sourceData: JSON.stringify({ qsofa: 2, rr: 28, sbp: 180, gcs: 15 }),
    },
    // Patient 3 — Drug allergy warning
    {
      patientId: patient3.id,
      encounterId: enc5.id,
      generatedForId: dr1.id,
      level: CDSSAlertLevel.CRITICAL,
      status: CDSSAlertStatus.ACKNOWLEDGED,
      category: 'DRUG_ALLERGY',
      title: 'ACE Inhibitor contraindicated — documented angioedema',
      body: 'Patient has history of angioedema with Ramipril (ACE inhibitor). All ACE inhibitors are contraindicated. ARBs may be used with caution.',
      suggestion: 'Losartan (ARB) has been prescribed as alternative. Monitor for cross-reactivity (rare but possible).',
      acknowledgedAt: daysAgo(3),
    },
    // Patient 2 — Formulary
    {
      patientId: patient2.id,
      encounterId: enc4.id,
      generatedForId: dr2.id,
      level: CDSSAlertLevel.INFO,
      status: CDSSAlertStatus.ACTIVE,
      category: 'FORMULARY',
      title: 'Sumatriptan availability note',
      body: 'Sumatriptan is available in Nigeria but may have limited stock outside major cities. Ensure patient can access reliable supply.',
      suggestion: 'Consider prescribing 2-month supply. Alternative: Ergotamine (more widely available but less effective).',
    },
  ];

  for (const alert of cdssAlerts) {
    await prisma.cDSSAlert.create({ data: alert });
  }
  console.log('✅ Created 7 CDSS alerts');

  // ── CDSS Interaction Logs ───────────────────────────────────────────
  const activeAlerts = await prisma.cDSSAlert.findMany({
    where: { status: CDSSAlertStatus.ACKNOWLEDGED },
  });

  for (const alert of activeAlerts) {
    await prisma.cDSSInteractionLog.create({
      data: {
        alertId: alert.id,
        physicianId: alert.generatedForId,
        action: 'ACKNOWLEDGED',
        notes: 'Noted and accounted for in treatment plan',
      },
    });
  }
  console.log('✅ Created CDSS interaction logs');

  // ── Summary ─────────────────────────────────────────────────────────
  console.log('\n🏥 EMR & CDSS seed complete!\n');
  console.log('📋 Test scenarios:');
  console.log('');
  console.log('  Patient 1 (John Doe) — Cardiac case:');
  console.log('    • 3 encounters (initial consult + 2 follow-ups, 1 unsigned DRAFT)');
  console.log('    • LIFE-THREATENING Penicillin allergy (triggers AllergyBanner)');
  console.log('    • Abnormal lipid panel + pre-diabetic labs');
  console.log('    • Active medications: Aspirin, Atorvastatin, Amlodipine, GTN');
  console.log('    • Family history: Father MI at 55');
  console.log('');
  console.log('  Patient 2 (Jane Smith) — Migraine case:');
  console.log('    • 1 encounter with neurologist');
  console.log('    • SEVERE Ibuprofen allergy');
  console.log('    • Pending MRI brain');
  console.log('    • Referral to Gynaecology (OCP + migraine with aura)');
  console.log('');
  console.log('  Patient 3 (Mike Wilson) — Emergency / Heart failure:');
  console.log('    • Emergency encounter, critically abnormal vitals');
  console.log('    • CRITICAL BNP, elevated troponin');
  console.log('    • ACE inhibitor allergy (angioedema) — discontinued Ramipril');
  console.log('    • Multiple CDSS alerts (critical BNP, qSOFA, drug allergy)');
  console.log('    • Missing DATA_PROCESSING consent (test consent gap report)');
  console.log('');
  console.log('  Login as Dr. Sarah Johnson (sarah.johnson@dfc.com / doctor123)');
  console.log('  Login as Dr. Michael Brown (michael.brown@dfc.com / doctor123)');
  console.log('  Login as John Doe (john.doe@example.com / patient123)');
}

main()
  .catch((e) => {
    console.error('❌ EMR seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
