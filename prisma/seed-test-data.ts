import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Helpers ─────────────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/dr\.\s*/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Data ────────────────────────────────────────────────────────────────────

const specialtyNames = [
  "Cardiology",
  "Internal Medicine",
  "General Surgery",
  "Obstetrics & Gynaecology",
  "Paediatrics",
  "Ophthalmology",
  "Orthopaedic Surgery",
  "Psychiatry",
  "Nephrology",
  "Dermatology",
  "Pulmonology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Haematology",
];

interface DoctorData {
  firstName: string;
  lastName: string;
  specialty: string;
  institution: string;
  city: string;
  mdcnNumber: string;
  experience: number;
  fee: number;
  bio: string;
  title: string;
  memberNumber: string;
}

const doctorsData: DoctorData[] = [
  {
    firstName: "Adebayo",
    lastName: "Ogunlade",
    specialty: "Cardiology",
    institution: "Lagos University Teaching Hospital (LUTH)",
    city: "Lagos",
    mdcnNumber: "MDCN/2005/12345",
    experience: 18,
    fee: 25000,
    bio: "Consultant Cardiologist with 18 years of experience in interventional cardiology and heart failure management. Fellow of the West African College of Physicians. Special interest in hypertensive heart disease and echocardiography.",
    title: "Dr.",
    memberNumber: "DFC-2024-101",
  },
  {
    firstName: "Ngozi",
    lastName: "Eze",
    specialty: "Internal Medicine",
    institution: "University of Nigeria Teaching Hospital (UNTH)",
    city: "Enugu",
    mdcnNumber: "MDCN/2008/23456",
    experience: 15,
    fee: 20000,
    bio: "Consultant Physician and Internist with expertise in tropical medicine and infectious diseases. Active researcher in malaria chemoprophylaxis and HIV management in sub-Saharan Africa.",
    title: "Dr.",
    memberNumber: "DFC-2024-102",
  },
  {
    firstName: "Oluwaseun",
    lastName: "Adeyemi",
    specialty: "General Surgery",
    institution: "University College Hospital (UCH)",
    city: "Ibadan",
    mdcnNumber: "MDCN/2003/34567",
    experience: 20,
    fee: 30000,
    bio: "Professor of Surgery and Consultant General Surgeon with 20 years of experience. Sub-specialty in hepatobiliary surgery and minimal access surgery. Former President of the Association of Surgeons of Nigeria.",
    title: "Prof.",
    memberNumber: "DFC-2024-103",
  },
  {
    firstName: "Fatima",
    lastName: "Bello",
    specialty: "Obstetrics & Gynaecology",
    institution: "Ahmadu Bello University Teaching Hospital (ABUTH)",
    city: "Zaria",
    mdcnNumber: "MDCN/2010/45678",
    experience: 13,
    fee: 22000,
    bio: "Consultant Obstetrician and Gynaecologist specialising in high-risk pregnancies and fertility medicine. Advocate for maternal health improvement in Northern Nigeria.",
    title: "Dr.",
    memberNumber: "DFC-2024-104",
  },
  {
    firstName: "Chukwuma",
    lastName: "Nwosu",
    specialty: "Paediatrics",
    institution: "University of Port Harcourt Teaching Hospital (UPTH)",
    city: "Port Harcourt",
    mdcnNumber: "MDCN/2007/56789",
    experience: 16,
    fee: 18000,
    bio: "Consultant Paediatrician with special interest in paediatric haematology and sickle cell disease management. Lead researcher on newborn screening programmes in the Niger Delta region.",
    title: "Dr.",
    memberNumber: "DFC-2024-105",
  },
  {
    firstName: "Aisha",
    lastName: "Mohammed",
    specialty: "Ophthalmology",
    institution: "National Hospital Abuja (NHA)",
    city: "Abuja",
    mdcnNumber: "MDCN/2012/67890",
    experience: 11,
    fee: 20000,
    bio: "Consultant Ophthalmologist with expertise in cataract surgery and glaucoma management. Fellow of the International Council of Ophthalmology. Active in blindness prevention programmes across Nigeria.",
    title: "Dr.",
    memberNumber: "DFC-2024-106",
  },
  {
    firstName: "Emeka",
    lastName: "Okafor",
    specialty: "Orthopaedic Surgery",
    institution: "National Orthopaedic Hospital Dala (NOHD)",
    city: "Enugu",
    mdcnNumber: "MDCN/2006/78901",
    experience: 17,
    fee: 28000,
    bio: "Consultant Orthopaedic Surgeon specialising in joint replacement and sports medicine. Fellow of the British Orthopaedic Association. Pioneer of arthroscopic surgery in South-East Nigeria.",
    title: "Dr.",
    memberNumber: "DFC-2024-107",
  },
  {
    firstName: "Yetunde",
    lastName: "Bakare",
    specialty: "Psychiatry",
    institution: "Neuropsychiatric Hospital Aro",
    city: "Abeokuta",
    mdcnNumber: "MDCN/2011/89012",
    experience: 12,
    fee: 15000,
    bio: "Consultant Psychiatrist with special interest in community psychiatry and substance use disorders. Advocate for mental health awareness and stigma reduction in Nigeria.",
    title: "Dr.",
    memberNumber: "DFC-2024-108",
  },
  {
    firstName: "Ibrahim",
    lastName: "Sani",
    specialty: "Nephrology",
    institution: "Aminu Kano Teaching Hospital (AKTH)",
    city: "Kano",
    mdcnNumber: "MDCN/2009/90123",
    experience: 14,
    fee: 25000,
    bio: "Consultant Nephrologist with expertise in dialysis and kidney transplantation. Lead advocate for chronic kidney disease prevention in Northern Nigeria. Fellow of the International Society of Nephrology.",
    title: "Dr.",
    memberNumber: "DFC-2024-109",
  },
  {
    firstName: "Blessing",
    lastName: "Okonkwo",
    specialty: "Dermatology",
    institution: "Lagos State University Teaching Hospital (LASUTH)",
    city: "Lagos",
    mdcnNumber: "MDCN/2013/01234",
    experience: 10,
    fee: 15000,
    bio: "Consultant Dermatologist specialising in dermatologic surgery and skin conditions prevalent in tropical climates. Research interest in keloid management and melanin-rich skin pathology.",
    title: "Dr.",
    memberNumber: "DFC-2024-110",
  },
  {
    firstName: "Tunde",
    lastName: "Afolabi",
    specialty: "Pulmonology",
    institution: "Lagos State General Hospital",
    city: "Lagos",
    mdcnNumber: "MDCN/2004/11234",
    experience: 19,
    fee: 22000,
    bio: "Consultant Pulmonologist with 19 years of experience in respiratory medicine. Expert in TB management, asthma, and COPD. Active in respiratory disease surveillance across West Africa.",
    title: "Dr.",
    memberNumber: "DFC-2024-111",
  },
  {
    firstName: "Hauwa",
    lastName: "Abdullahi",
    specialty: "Endocrinology",
    institution: "Jos University Teaching Hospital (JUTH)",
    city: "Jos",
    mdcnNumber: "MDCN/2014/22345",
    experience: 9,
    fee: 18000,
    bio: "Consultant Endocrinologist with expertise in diabetes management and thyroid disorders. Lead researcher on the epidemiology of diabetes mellitus in the Middle Belt region.",
    title: "Dr.",
    memberNumber: "DFC-2024-112",
  },
  {
    firstName: "Obioma",
    lastName: "Uchenna",
    specialty: "Gastroenterology",
    institution: "Federal Medical Centre (FMC) Owerri",
    city: "Owerri",
    mdcnNumber: "MDCN/2008/33456",
    experience: 15,
    fee: 20000,
    bio: "Consultant Gastroenterologist specialising in hepatology and therapeutic endoscopy. Research interests include hepatitis B/C management and liver disease in Nigeria.",
    title: "Dr.",
    memberNumber: "DFC-2024-113",
  },
  {
    firstName: "Kehinde",
    lastName: "Oladipo",
    specialty: "Neurology",
    institution: "University College Hospital (UCH)",
    city: "Ibadan",
    mdcnNumber: "MDCN/2006/44567",
    experience: 17,
    fee: 25000,
    bio: "Consultant Neurologist and epileptologist with expertise in stroke management and neurophysiology. Fellow of the World Federation of Neurology. Pioneer of the Ibadan Stroke Registry.",
    title: "Dr.",
    memberNumber: "DFC-2024-114",
  },
  {
    firstName: "Amina",
    lastName: "Yusuf",
    specialty: "Haematology",
    institution: "Ahmadu Bello University Teaching Hospital (ABUTH)",
    city: "Zaria",
    mdcnNumber: "MDCN/2010/55678",
    experience: 13,
    fee: 20000,
    bio: "Consultant Haematologist with expertise in sickle cell disease, blood banking, and coagulation disorders. Active in national sickle cell screening programmes and blood safety initiatives.",
    title: "Dr.",
    memberNumber: "DFC-2024-115",
  },
];

interface PatientData {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  city: string;
  occupation: string;
  maritalStatus: string;
  nhisNumber?: string;
  hmoName?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelation?: string;
  allergies?: string;
}

const patientsData: PatientData[] = [
  { firstName: "Chidinma", lastName: "Obi", gender: "female", dob: "1990-03-15", bloodGroup: "O+", city: "Lagos", occupation: "Software Developer", maritalStatus: "Single", nhisNumber: "NHIS-2024-10001", hmoName: "Leadway Health", nextOfKinName: "Nneka Obi", nextOfKinPhone: "+234 803 111 2233", nextOfKinRelation: "Sister" },
  { firstName: "Emeka", lastName: "Uzoma", gender: "male", dob: "1985-07-22", bloodGroup: "A+", city: "Enugu", occupation: "Civil Servant", maritalStatus: "Married", nhisNumber: "NHIS-2024-10002", hmoName: "AXA Mansard", nextOfKinName: "Ada Uzoma", nextOfKinPhone: "+234 805 222 3344", nextOfKinRelation: "Wife" },
  { firstName: "Fatimah", lastName: "Abubakar", gender: "female", dob: "1978-11-08", bloodGroup: "B+", city: "Kano", occupation: "Trader", maritalStatus: "Married", nextOfKinName: "Sani Abubakar", nextOfKinPhone: "+234 806 333 4455", nextOfKinRelation: "Husband", allergies: "Penicillin — rash" },
  { firstName: "Oluwadamilola", lastName: "Adesanya", gender: "male", dob: "1992-05-30", bloodGroup: "AB+", city: "Ibadan", occupation: "Banker", maritalStatus: "Single" },
  { firstName: "Ifunanya", lastName: "Okoro", gender: "female", dob: "1988-09-12", bloodGroup: "O-", city: "Lagos", occupation: "Nurse", maritalStatus: "Married", nhisNumber: "NHIS-2024-10005", hmoName: "HMO HealthPlus", nextOfKinName: "Obinna Okoro", nextOfKinPhone: "+234 808 555 6677", nextOfKinRelation: "Husband", allergies: "Sulfonamides — SJS history" },
  { firstName: "Yusuf", lastName: "Garba", gender: "male", dob: "1975-01-25", bloodGroup: "A+", city: "Abuja", occupation: "Retired Military", maritalStatus: "Married", nhisNumber: "NHIS-2024-10006", hmoName: "Hygeia", nextOfKinName: "Amina Garba", nextOfKinPhone: "+234 809 666 7788", nextOfKinRelation: "Wife" },
  { firstName: "Adaeze", lastName: "Nnamdi", gender: "female", dob: "1995-12-03", bloodGroup: "B-", city: "Port Harcourt", occupation: "Student", maritalStatus: "Single" },
  { firstName: "Segun", lastName: "Adewale", gender: "male", dob: "1970-06-18", bloodGroup: "O+", city: "Lagos", occupation: "Business Owner", maritalStatus: "Married", nhisNumber: "NHIS-2024-10008", nextOfKinName: "Funke Adewale", nextOfKinPhone: "+234 802 888 9900", nextOfKinRelation: "Wife", allergies: "ACE inhibitors — angioedema" },
  { firstName: "Halima", lastName: "Musa", gender: "female", dob: "1982-04-07", bloodGroup: "A-", city: "Kaduna", occupation: "Teacher", maritalStatus: "Married", hmoName: "AXA Mansard" },
  { firstName: "Chinedu", lastName: "Igwe", gender: "male", dob: "1998-08-21", bloodGroup: "O+", city: "Owerri", occupation: "IT Consultant", maritalStatus: "Single" },
  { firstName: "Abiodun", lastName: "Falola", gender: "female", dob: "1973-02-14", bloodGroup: "B+", city: "Ibadan", occupation: "Pharmacist", maritalStatus: "Married", nhisNumber: "NHIS-2024-10011", hmoName: "Leadway Health", nextOfKinName: "Femi Falola", nextOfKinPhone: "+234 803 111 0011", nextOfKinRelation: "Husband" },
  { firstName: "Musa", lastName: "Aliyu", gender: "male", dob: "1980-10-30", bloodGroup: "A+", city: "Maiduguri", occupation: "Driver", maritalStatus: "Married" },
  { firstName: "Nneka", lastName: "Eze", gender: "female", dob: "1993-07-09", bloodGroup: "O+", city: "Enugu", occupation: "Lawyer", maritalStatus: "Single" },
  { firstName: "Tobiloba", lastName: "Oyelaran", gender: "male", dob: "1987-03-25", bloodGroup: "AB-", city: "Lagos", occupation: "Architect", maritalStatus: "Married", hmoName: "Hygeia", nextOfKinName: "Bola Oyelaran", nextOfKinPhone: "+234 805 141 5161", nextOfKinRelation: "Wife" },
  { firstName: "Zainab", lastName: "Ibrahim", gender: "female", dob: "1991-11-17", bloodGroup: "B+", city: "Jos", occupation: "Journalist", maritalStatus: "Single" },
  { firstName: "Ikechukwu", lastName: "Anyanwu", gender: "male", dob: "1968-05-02", bloodGroup: "O+", city: "Aba", occupation: "Market Trader", maritalStatus: "Married", nextOfKinName: "Ngozi Anyanwu", nextOfKinPhone: "+234 806 161 7181", nextOfKinRelation: "Wife" },
  { firstName: "Folake", lastName: "Adegoke", gender: "female", dob: "1984-08-28", bloodGroup: "A+", city: "Abeokuta", occupation: "Civil Servant", maritalStatus: "Married", nhisNumber: "NHIS-2024-10017", hmoName: "HMO HealthPlus" },
  { firstName: "Abdulrazaq", lastName: "Balogun", gender: "male", dob: "1996-01-13", bloodGroup: "B-", city: "Ilorin", occupation: "Engineering Student", maritalStatus: "Single" },
  { firstName: "Chiamaka", lastName: "Ugwu", gender: "female", dob: "1979-12-20", bloodGroup: "O+", city: "Nsukka", occupation: "Farmer", maritalStatus: "Married", nextOfKinName: "Ugochukwu Ugwu", nextOfKinPhone: "+234 808 191 2021", nextOfKinRelation: "Husband" },
  { firstName: "Taiwo", lastName: "Ogunbiyi", gender: "male", dob: "1990-09-06", bloodGroup: "A+", city: "Lagos", occupation: "Accountant", maritalStatus: "Single" },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding test data...\n");

  const doctorPw = await bcrypt.hash("doctor123", 12);
  const patientPw = await bcrypt.hash("patient123", 12);

  // ── 1. Specialties ──────────────────────────────────────────────────────
  const specialtyMap: Record<string, string> = {};
  for (const name of specialtyNames) {
    const existing = await prisma.specialty.findFirst({ where: { name } });
    if (existing) {
      specialtyMap[name] = existing.id;
    } else {
      const created = await prisma.specialty.create({
        data: { name, description: `${name} specialty` },
      });
      specialtyMap[name] = created.id;
    }
  }
  console.log(`  Specialties: ${Object.keys(specialtyMap).length} ensured`);

  // ── 2. Doctors ──────────────────────────────────────────────────────────
  const doctorUsers: { userId: string; profileId: string; dfcMemberId: string; fee: number; specialty: string }[] = [];

  for (const doc of doctorsData) {
    const email = `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@dfc.ng`;
    const fullName = `${doc.title} ${doc.firstName} ${doc.lastName}`;
    const slug = slugify(fullName);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: doctorPw,
        name: fullName,
        phone: `+234 ${800 + doctorsData.indexOf(doc)} 000 ${String(1000 + doctorsData.indexOf(doc))}`,
        role: UserRole.DFC_MEMBER,
      },
    });

    // Doctor Profile
    let profile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          slug,
          license: doc.mdcnNumber,
          experience: doc.experience,
          bio: doc.bio,
          consultationFee: doc.fee,
          currency: "NGN",
          country: "Nigeria",
          institution: doc.institution,
          city: doc.city,
          title: doc.title,
          mdcnNumber: doc.mdcnNumber,
          isAvailable: true,
          specialtyId: specialtyMap[doc.specialty],
        },
      });
    }

    // DFC Membership
    let dfcMember = await prisma.dFCMember.findUnique({ where: { userId: user.id } });
    if (!dfcMember) {
      dfcMember = await prisma.dFCMember.create({
        data: {
          userId: user.id,
          category: "MEMBER",
          status: "ACTIVE",
          goodStanding: true,
          path: "diaspora",
          duesStatus: "PAID",
          lastDuesPaidAt: daysAgo(60),
          duesExpiresAt: daysFromNow(305),
          duesPaidAmount: 50000,
          registrationFeePaidAt: daysAgo(365),
          memberNumber: doc.memberNumber,
          effectiveDate: daysAgo(365),
          nigerianLicence: doc.mdcnNumber,
          institution: doc.institution,
          acceptsReferrals: true,
          profileCompletionScore: 95,
          lastVerifiedAt: daysAgo(30),
        },
      });
    }

    // Medical Credential
    const existingCred = await prisma.medicalCredential.findFirst({
      where: { dfcMemberId: dfcMember.id, registrationNumber: doc.mdcnNumber },
    });
    if (!existingCred) {
      await prisma.medicalCredential.create({
        data: {
          dfcMemberId: dfcMember.id,
          type: "MDCN",
          registrationNumber: doc.mdcnNumber,
          issuingBody: "Medical and Dental Council of Nigeria",
          country: "Nigeria",
          specialty: doc.specialty,
          issueDate: daysAgo(doc.experience * 365),
          expiryDate: daysFromNow(730),
          status: "VERIFIED",
          verifiedAt: daysAgo(30),
          lastCheckedAt: daysAgo(7),
        },
      });
    }

    // Schedules — 2-3 per doctor
    const existingSchedules = await prisma.doctorSchedule.count({ where: { doctorId: profile.id } });
    if (existingSchedules === 0) {
      const slotDuration = doctorsData.indexOf(doc) % 2 === 0 ? 30 : 15;
      // Morning schedule (Mon-Wed or Mon-Fri)
      const morningDays = doctorsData.indexOf(doc) % 3 === 0 ? [1, 2, 3] : [1, 2, 3, 4, 5];
      for (const day of morningDays) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profile.id,
            title: "Morning Clinic",
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "12:00",
            slotDuration,
            bufferTime: 5,
            scheduleType: "AVAILABLE",
            isRecurring: true,
            maxBookingsPerSlot: 1,
            color: "#3B82F6",
          },
        });
      }
      // Afternoon schedule (different days)
      const afternoonDays = doctorsData.indexOf(doc) % 3 === 0 ? [4, 5] : [1, 3, 5];
      for (const day of afternoonDays) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profile.id,
            title: "Afternoon Clinic",
            dayOfWeek: day,
            startTime: "13:00",
            endTime: "17:00",
            slotDuration,
            bufferTime: 5,
            scheduleType: "AVAILABLE",
            isRecurring: true,
            maxBookingsPerSlot: 1,
            color: "#10B981",
          },
        });
      }
    }

    doctorUsers.push({
      userId: user.id,
      profileId: profile.id,
      dfcMemberId: dfcMember.id,
      fee: doc.fee,
      specialty: doc.specialty,
    });
  }
  console.log(`  Doctors: ${doctorUsers.length} created/ensured with profiles, DFC membership, credentials, schedules`);

  // ── 3. Patients ─────────────────────────────────────────────────────────
  const patientUsers: { userId: string; profileId: string }[] = [];

  for (const pat of patientsData) {
    const email = `${pat.firstName.toLowerCase()}.${pat.lastName.toLowerCase()}@patient.dfc.ng`;
    const fullName = `${pat.firstName} ${pat.lastName}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: patientPw,
        name: fullName,
        phone: `+234 ${810 + patientsData.indexOf(pat)} 000 ${String(2000 + patientsData.indexOf(pat))}`,
        role: UserRole.PATIENT,
      },
    });

    let profile = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      profile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date(pat.dob),
          gender: pat.gender,
          address: `${Math.floor(Math.random() * 200) + 1} ${["Broad Street", "Herbert Macaulay Way", "Awolowo Road", "Ahmadu Bello Way", "Nnamdi Azikiwe Street"][patientsData.indexOf(pat) % 5]}, ${pat.city}, Nigeria`,
          emergencyContact: pat.nextOfKinPhone || `+234 ${900 + patientsData.indexOf(pat)} 000 0000`,
          bloodGroup: pat.bloodGroup,
          nationality: "Nigerian",
          occupation: pat.occupation,
          maritalStatus: pat.maritalStatus,
          nhisNumber: pat.nhisNumber || null,
          hmoName: pat.hmoName || null,
          nextOfKinName: pat.nextOfKinName || null,
          nextOfKinPhone: pat.nextOfKinPhone || null,
          nextOfKinRelation: pat.nextOfKinRelation || null,
          allergies: pat.allergies || null,
        },
      });
    }

    patientUsers.push({ userId: user.id, profileId: profile.id });
  }
  console.log(`  Patients: ${patientUsers.length} created/ensured with profiles`);

  // ── 4. Appointments ─────────────────────────────────────────────────────
  interface ApptDef {
    patientIdx: number;
    doctorIdx: number;
    status: string;
    daysOffset: number; // negative = past, positive = future
    startTime: string;
    endTime: string;
    reason: string;
  }

  const appointmentDefs: ApptDef[] = [
    // 10 COMPLETED (past)
    { patientIdx: 0, doctorIdx: 0, status: "COMPLETED", daysOffset: -45, startTime: "09:00", endTime: "09:30", reason: "Routine hypertension follow-up" },
    { patientIdx: 1, doctorIdx: 1, status: "COMPLETED", daysOffset: -40, startTime: "10:00", endTime: "10:30", reason: "Malaria symptoms — fever, chills, body aches" },
    { patientIdx: 2, doctorIdx: 8, status: "COMPLETED", daysOffset: -38, startTime: "08:30", endTime: "09:00", reason: "Chronic kidney disease follow-up and dialysis review" },
    { patientIdx: 3, doctorIdx: 2, status: "COMPLETED", daysOffset: -35, startTime: "13:00", endTime: "13:30", reason: "Pre-operative assessment for hernia repair" },
    { patientIdx: 4, doctorIdx: 3, status: "COMPLETED", daysOffset: -30, startTime: "09:00", endTime: "09:30", reason: "Antenatal check — second trimester" },
    { patientIdx: 5, doctorIdx: 0, status: "COMPLETED", daysOffset: -28, startTime: "10:30", endTime: "11:00", reason: "Chest pain evaluation" },
    { patientIdx: 6, doctorIdx: 4, status: "COMPLETED", daysOffset: -25, startTime: "08:00", endTime: "08:30", reason: "Sickle cell crisis — emergency" },
    { patientIdx: 7, doctorIdx: 10, status: "COMPLETED", daysOffset: -20, startTime: "14:00", endTime: "14:30", reason: "Chronic cough and SOB — 6 weeks duration" },
    { patientIdx: 8, doctorIdx: 11, status: "COMPLETED", daysOffset: -18, startTime: "09:00", endTime: "09:30", reason: "Type 2 diabetes management — HbA1c review" },
    { patientIdx: 9, doctorIdx: 9, status: "COMPLETED", daysOffset: -15, startTime: "13:00", endTime: "13:30", reason: "Skin rash evaluation — possible eczema" },
    // 8 CONFIRMED (next 2 weeks)
    { patientIdx: 10, doctorIdx: 12, status: "CONFIRMED", daysOffset: 2, startTime: "09:00", endTime: "09:30", reason: "Epigastric pain and bloating — H. pylori follow-up" },
    { patientIdx: 11, doctorIdx: 1, status: "CONFIRMED", daysOffset: 3, startTime: "10:00", endTime: "10:30", reason: "Routine medical check-up" },
    { patientIdx: 12, doctorIdx: 13, status: "CONFIRMED", daysOffset: 5, startTime: "08:00", endTime: "08:30", reason: "Recurrent headaches — neurological assessment" },
    { patientIdx: 13, doctorIdx: 6, status: "CONFIRMED", daysOffset: 6, startTime: "14:00", endTime: "14:30", reason: "Joint pain assessment — right knee" },
    { patientIdx: 14, doctorIdx: 7, status: "CONFIRMED", daysOffset: 8, startTime: "09:00", endTime: "09:30", reason: "Anxiety and insomnia — initial consultation" },
    { patientIdx: 15, doctorIdx: 5, status: "CONFIRMED", daysOffset: 10, startTime: "10:00", endTime: "10:30", reason: "Blurry vision — cataract screening" },
    { patientIdx: 16, doctorIdx: 14, status: "CONFIRMED", daysOffset: 12, startTime: "13:00", endTime: "13:30", reason: "Anaemia workup — fatigue and pallor" },
    { patientIdx: 17, doctorIdx: 0, status: "CONFIRMED", daysOffset: 14, startTime: "08:30", endTime: "09:00", reason: "Palpitations and dizziness" },
    // 7 PENDING (next month)
    { patientIdx: 18, doctorIdx: 3, status: "PENDING", daysOffset: 16, startTime: "09:00", endTime: "09:30", reason: "Irregular periods and pelvic pain" },
    { patientIdx: 19, doctorIdx: 10, status: "PENDING", daysOffset: 18, startTime: "14:00", endTime: "14:30", reason: "Asthma control review" },
    { patientIdx: 0, doctorIdx: 11, status: "PENDING", daysOffset: 20, startTime: "09:00", endTime: "09:30", reason: "Thyroid function assessment" },
    { patientIdx: 1, doctorIdx: 9, status: "PENDING", daysOffset: 22, startTime: "13:00", endTime: "13:30", reason: "Chronic skin condition — follow-up" },
    { patientIdx: 2, doctorIdx: 4, status: "PENDING", daysOffset: 24, startTime: "10:00", endTime: "10:30", reason: "Childhood immunisation review" },
    { patientIdx: 3, doctorIdx: 12, status: "PENDING", daysOffset: 26, startTime: "08:00", endTime: "08:30", reason: "Upper GI endoscopy pre-assessment" },
    { patientIdx: 4, doctorIdx: 14, status: "PENDING", daysOffset: 28, startTime: "09:00", endTime: "09:30", reason: "Blood transfusion assessment — chronic anaemia" },
    // 3 CANCELLED
    { patientIdx: 5, doctorIdx: 2, status: "CANCELLED", daysOffset: -10, startTime: "10:00", endTime: "10:30", reason: "Surgical consultation — cancelled by patient" },
    { patientIdx: 6, doctorIdx: 13, status: "CANCELLED", daysOffset: -5, startTime: "14:00", endTime: "14:30", reason: "Migraine follow-up — cancelled due to scheduling conflict" },
    { patientIdx: 7, doctorIdx: 8, status: "CANCELLED", daysOffset: 4, startTime: "09:00", endTime: "09:30", reason: "Kidney function review — rescheduled" },
    // 2 NO_SHOW
    { patientIdx: 8, doctorIdx: 5, status: "NO_SHOW", daysOffset: -12, startTime: "10:00", endTime: "10:30", reason: "Eye examination — patient did not attend" },
    { patientIdx: 9, doctorIdx: 7, status: "NO_SHOW", daysOffset: -8, startTime: "13:00", endTime: "13:30", reason: "Mental health consultation — no show" },
  ];

  // Check if appointments already seeded (use a marker)
  const existingTestAppts = await prisma.appointment.count({
    where: { reason: { startsWith: "Routine hypertension follow-up" } },
  });

  const createdAppointmentIds: string[] = [];
  if (existingTestAppts === 0) {
    for (const appt of appointmentDefs) {
      const patient = patientUsers[appt.patientIdx];
      const doctor = doctorUsers[appt.doctorIdx];
      const appointmentDate =
        appt.daysOffset < 0
          ? daysAgo(Math.abs(appt.daysOffset))
          : daysFromNow(appt.daysOffset);

      const created = await prisma.appointment.create({
        data: {
          patientId: patient.userId,
          doctorId: doctor.userId,
          appointmentDate,
          startTime: appt.startTime,
          endTime: appt.endTime,
          status: appt.status as any,
          reason: appt.reason,
          consultationFee: doctor.fee,
        },
      });
      createdAppointmentIds.push(created.id);
    }
    console.log(`  Appointments: ${createdAppointmentIds.length} created`);
  } else {
    console.log("  Appointments: already seeded, skipping");
    // Fetch existing to use for EMR data
    const existing = await prisma.appointment.findMany({
      where: { status: "COMPLETED" },
      orderBy: { appointmentDate: "asc" },
      take: 10,
    });
    for (const a of existing) createdAppointmentIds.push(a.id);
  }

  // ── 5. EMR Data ─────────────────────────────────────────────────────────
  // Only create if not already seeded
  const existingEncounters = await prisma.clinicalEncounter.count({
    where: {
      doctor: { userId: { in: doctorUsers.map((d) => d.userId) } },
    },
  });

  if (existingEncounters === 0) {
    console.log("\n  Seeding EMR data...");

    // Scenario 1: Hypertensive patient follow-up (Patient 0, Doctor 0 — Cardiology)
    const enc1 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[0].profileId,
        doctorId: doctorUsers[0].profileId,
        encounterType: "FOLLOW_UP",
        encounterDate: daysAgo(45),
        chiefComplaint: "Routine hypertension follow-up — BP control assessment",
        subjective:
          "Patient reports adherence to Amlodipine 10mg daily and Losartan 50mg daily. Occasional headaches in the morning, no dizziness. Reduced salt intake as advised. Walking 30 minutes daily. No chest pain or SOB.",
        objective:
          "BP: 142/88 mmHg (was 168/102 at last visit). HR: 74 bpm, regular. BMI: 27.2. Heart sounds normal, no murmurs. Lungs clear. No peripheral oedema. Fundoscopy: grade I hypertensive changes.",
        assessment:
          "Essential hypertension — improving on dual therapy but not yet at target (<140/90). Grade I hypertensive retinopathy noted.",
        plan: "1. Continue Amlodipine 10mg OD\n2. Increase Losartan to 100mg OD\n3. Add Hydrochlorothiazide 12.5mg OD if not at target by next visit\n4. Lipid profile, U&E, FBS\n5. Continue lifestyle modification\n6. Review in 4 weeks",
        primaryDiagnosis: "I10 — Essential hypertension",
        secondaryDiagnoses: JSON.stringify(["H35.0 — Hypertensive retinopathy"]),
        status: "SIGNED",
        signedAt: daysAgo(45),
        signedById: doctorUsers[0].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[0].profileId,
        encounterId: enc1.id,
        recordedById: doctorUsers[0].profileId,
        recordedAt: daysAgo(45),
        systolicBP: 142,
        diastolicBP: 88,
        heartRate: 74,
        respiratoryRate: 16,
        temperature: 36.6,
        oxygenSat: 98.0,
        weight: 78.0,
        height: 169.0,
        bmi: 27.2,
      },
    });

    // Prescription 1
    await prisma.prescription.create({
      data: {
        encounterId: enc1.id,
        patientId: patientUsers[0].profileId,
        prescribedById: doctorUsers[0].profileId,
        rxNumber: "DFC-RX-2026-0101",
        status: "DISPENSED",
        dispensedAt: daysAgo(44),
        expiresAt: daysFromNow(46),
        items: {
          create: [
            { drugName: "Amlodipine", dose: "10mg", form: "Tablet", route: "PO", frequency: "Once daily", duration: "90 days", quantity: "90 tablets", instructions: "Take in the morning" },
            { drugName: "Losartan", dose: "100mg", form: "Tablet", route: "PO", frequency: "Once daily", duration: "90 days", quantity: "90 tablets", instructions: "Take in the morning. Monitor BP daily." },
          ],
        },
      },
    });

    // Scenario 2: Malaria case (Patient 1, Doctor 1 — Internal Medicine)
    const enc2 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[1].profileId,
        doctorId: doctorUsers[1].profileId,
        encounterType: "CONSULTATION",
        encounterDate: daysAgo(40),
        chiefComplaint: "High-grade fever, chills, body aches for 3 days",
        subjective:
          "Patient presents with 3-day history of high-grade fever (up to 39.5C), rigors, profuse sweating, generalised body aches, headache, and anorexia. Vomited twice yesterday. No cough, no rash, no urinary symptoms. Travelled to rural Enugu community 2 weeks ago. No ITN use.",
        objective:
          "Temp: 38.8C. HR: 102 bpm. BP: 110/70 mmHg. Mild pallor. No jaundice. Abdomen: soft, tender hepatomegaly 2cm below costal margin. Spleen not palpable. No meningism. mRDT: Positive for P. falciparum.",
        assessment:
          "Uncomplicated falciparum malaria. Mild dehydration. No features of severe malaria.",
        plan: "1. Artemether-Lumefantrine (Coartem) 80/480mg BD x 3 days\n2. Paracetamol 1g QDS for fever\n3. ORS and increased oral fluids\n4. FBC, malaria parasite count, LFT\n5. Review in 48 hours — if not improving, admit for IV artesunate\n6. Advise ITN use going forward",
        primaryDiagnosis: "B50.9 — Plasmodium falciparum malaria, unspecified",
        secondaryDiagnoses: JSON.stringify(["E86.0 — Dehydration"]),
        status: "SIGNED",
        signedAt: daysAgo(40),
        signedById: doctorUsers[1].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[1].profileId,
        encounterId: enc2.id,
        recordedById: doctorUsers[1].profileId,
        recordedAt: daysAgo(40),
        systolicBP: 110,
        diastolicBP: 70,
        heartRate: 102,
        respiratoryRate: 20,
        temperature: 38.8,
        oxygenSat: 97.0,
        weight: 82.0,
        height: 175.0,
        bmi: 26.8,
      },
    });

    await prisma.prescription.create({
      data: {
        encounterId: enc2.id,
        patientId: patientUsers[1].profileId,
        prescribedById: doctorUsers[1].profileId,
        rxNumber: "DFC-RX-2026-0102",
        status: "DISPENSED",
        dispensedAt: daysAgo(40),
        expiresAt: daysAgo(37),
        items: {
          create: [
            { drugName: "Artemether-Lumefantrine (Coartem)", dose: "80/480mg", form: "Tablet", route: "PO", frequency: "Twice daily", duration: "3 days", quantity: "12 tablets", instructions: "Take with fatty food for better absorption. Complete all doses even if feeling better." },
            { drugName: "Paracetamol", dose: "1g", form: "Tablet", route: "PO", frequency: "Every 6 hours", duration: "5 days", quantity: "20 tablets", instructions: "Take for fever and body pain. Do not exceed 4g per day." },
          ],
        },
      },
    });

    const inv2a = await prisma.investigationOrder.create({
      data: {
        encounterId: enc2.id,
        patientId: patientUsers[1].profileId,
        orderedById: doctorUsers[1].profileId,
        type: "LAB",
        name: "Malaria Parasite Count & FBC",
        urgency: "URGENT",
        status: "RESULTED",
        resultedAt: daysAgo(40),
      },
    });

    await prisma.labResult.create({
      data: {
        patientId: patientUsers[1].profileId,
        investigationId: inv2a.id,
        uploadedById: doctorUsers[1].profileId,
        testName: "Malaria Parasite Count & FBC",
        labName: "UNTH Parasitology Lab",
        reportDate: daysAgo(40),
        results: JSON.stringify([
          { test: "Malaria Parasite", value: "+++(48,000/uL)", unit: "parasites/uL", refRange: "Negative", flag: "HIGH" },
          { test: "Haemoglobin", value: "10.8", unit: "g/dL", refRange: "13-17", flag: "LOW" },
          { test: "WBC", value: "5.2", unit: "x10^9/L", refRange: "4-11", flag: "NORMAL" },
          { test: "Platelet", value: "98", unit: "x10^9/L", refRange: "150-400", flag: "LOW" },
        ]),
        interpretation: "Moderate parasitaemia with mild anaemia and thrombocytopaenia — consistent with acute falciparum malaria. No features suggesting severe malaria.",
        isAbnormal: true,
        reviewedById: doctorUsers[1].profileId,
        reviewedAt: daysAgo(40),
      },
    });

    // Scenario 3: Type 2 Diabetes (Patient 8, Doctor 11 — Endocrinology)
    const enc3 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[8].profileId,
        doctorId: doctorUsers[11].profileId,
        encounterType: "FOLLOW_UP",
        encounterDate: daysAgo(18),
        chiefComplaint: "Type 2 diabetes management — HbA1c review",
        subjective:
          "Known T2DM for 5 years on Metformin 1g BD and Glimepiride 2mg OD. Reports good dietary compliance. Occasional episodes of mild hypoglycaemia (sweating, tremors) in late afternoon. No polyuria, polydipsia. No foot ulcers or visual changes. Home glucose monitoring: FBS 6-8 mmol/L.",
        objective:
          "BP: 128/78 mmHg. BMI: 28.5. Acanthosis nigricans at nape of neck. Peripheral pulses palpable. Monofilament test: intact bilaterally. No foot ulcers.",
        assessment:
          "Type 2 diabetes mellitus — fair control. Mild hypoglycaemic episodes likely from Glimepiride. BMI still elevated.",
        plan: "1. Reduce Glimepiride to 1mg OD (hypoglycaemia risk)\n2. Continue Metformin 1g BD\n3. HbA1c, FBS, lipid profile, U&E, urine microalbumin\n4. Annual diabetic retinal screening\n5. Reinforce dietary counseling and exercise\n6. Review in 3 months with results",
        primaryDiagnosis: "E11.9 — Type 2 diabetes mellitus without complications",
        status: "SIGNED",
        signedAt: daysAgo(18),
        signedById: doctorUsers[11].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[8].profileId,
        encounterId: enc3.id,
        recordedById: doctorUsers[11].profileId,
        recordedAt: daysAgo(18),
        systolicBP: 128,
        diastolicBP: 78,
        heartRate: 76,
        respiratoryRate: 16,
        temperature: 36.5,
        oxygenSat: 99.0,
        weight: 74.0,
        height: 161.0,
        bmi: 28.5,
        bloodGlucose: 7.2,
      },
    });

    await prisma.prescription.create({
      data: {
        encounterId: enc3.id,
        patientId: patientUsers[8].profileId,
        prescribedById: doctorUsers[11].profileId,
        rxNumber: "DFC-RX-2026-0103",
        status: "ACTIVE",
        expiresAt: daysFromNow(72),
        items: {
          create: [
            { drugName: "Metformin", dose: "1000mg", form: "Tablet", route: "PO", frequency: "Twice daily", duration: "90 days", quantity: "180 tablets", instructions: "Take with meals to reduce GI side effects. Do not crush." },
            { drugName: "Glimepiride", dose: "1mg", form: "Tablet", route: "PO", frequency: "Once daily", duration: "90 days", quantity: "90 tablets", instructions: "Take with breakfast. Carry glucose tablets for hypoglycaemia." },
          ],
        },
      },
    });

    const inv3a = await prisma.investigationOrder.create({
      data: {
        encounterId: enc3.id,
        patientId: patientUsers[8].profileId,
        orderedById: doctorUsers[11].profileId,
        type: "LAB",
        name: "HbA1c and Metabolic Panel",
        urgency: "ROUTINE",
        status: "RESULTED",
        resultedAt: daysAgo(16),
      },
    });

    await prisma.labResult.create({
      data: {
        patientId: patientUsers[8].profileId,
        investigationId: inv3a.id,
        uploadedById: doctorUsers[11].profileId,
        testName: "HbA1c and Metabolic Panel",
        labName: "JUTH Chemical Pathology Lab",
        reportDate: daysAgo(16),
        results: JSON.stringify([
          { test: "HbA1c", value: "7.4", unit: "%", refRange: "<7.0", flag: "HIGH" },
          { test: "FBS", value: "7.1", unit: "mmol/L", refRange: "3.9-5.6", flag: "HIGH" },
          { test: "Total Cholesterol", value: "5.6", unit: "mmol/L", refRange: "<5.2", flag: "HIGH" },
          { test: "Creatinine", value: "88", unit: "umol/L", refRange: "60-120", flag: "NORMAL" },
          { test: "Urine Microalbumin", value: "18", unit: "mg/L", refRange: "<20", flag: "NORMAL" },
        ]),
        interpretation: "HbA1c 7.4% — above target but improving. No microalbuminuria — no early nephropathy. Mild dyslipidaemia.",
        isAbnormal: true,
        reviewedById: doctorUsers[11].profileId,
        reviewedAt: daysAgo(15),
      },
    });

    // Scenario 4: Antenatal visit (Patient 4, Doctor 3 — O&G)
    const enc4 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[4].profileId,
        doctorId: doctorUsers[3].profileId,
        encounterType: "CONSULTATION",
        encounterDate: daysAgo(30),
        chiefComplaint: "Routine antenatal visit — 24 weeks gestation",
        subjective:
          "G2P1+0, 24 weeks by dates and scan. LMP 6 months ago. No vaginal bleeding or discharge. Fetal movements felt and active. No headaches, visual disturbance, or epigastric pain. Previous SVD 3 years ago — uncomplicated. Taking routine antenatal drugs (ferrous sulphate, folic acid, calcium).",
        objective:
          "BP: 112/68 mmHg. Urine dipstick: protein negative, glucose negative. Weight: 72kg (pre-pregnancy 66kg). SFH: 24cm (consistent with dates). FHR: 148 bpm, regular. No oedema. Hb: 10.4 g/dL.",
        assessment:
          "Normal pregnancy at 24 weeks. Mild anaemia (Hb 10.4 — common in pregnancy). Growth appropriate for gestational age.",
        plan: "1. Continue iron/folate supplementation — increase ferrous sulphate to 200mg TDS\n2. FBC, blood group, Genotype, VDRL, Hepatitis B, HIV screening\n3. Anomaly scan at 28 weeks\n4. Review in 2 weeks\n5. Educate on danger signs in pregnancy",
        primaryDiagnosis: "Z34.0 — Supervision of normal first pregnancy",
        secondaryDiagnoses: JSON.stringify(["O99.0 — Anaemia complicating pregnancy"]),
        status: "SIGNED",
        signedAt: daysAgo(30),
        signedById: doctorUsers[3].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[4].profileId,
        encounterId: enc4.id,
        recordedById: doctorUsers[3].profileId,
        recordedAt: daysAgo(30),
        systolicBP: 112,
        diastolicBP: 68,
        heartRate: 84,
        respiratoryRate: 16,
        temperature: 36.7,
        oxygenSat: 99.0,
        weight: 72.0,
        height: 164.0,
        bmi: 26.8,
      },
    });

    // Scenario 5: Sickle cell crisis (Patient 6, Doctor 4 — Paediatrics — but patient is young adult)
    const enc5 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[6].profileId,
        doctorId: doctorUsers[4].profileId,
        encounterType: "EMERGENCY",
        encounterDate: daysAgo(25),
        chiefComplaint: "Severe bone pain crisis — limbs and back, 2 days",
        subjective:
          "Known HbSS patient since childhood. Presents with severe pain in both lower limbs, lower back, and chest for 2 days. Pain rated 9/10. Triggered by recent cold weather and dehydration during exams. Low-grade fever. No cough or SOB. On daily Hydroxyurea 500mg. Last crisis 4 months ago.",
        objective:
          "Temp: 37.9C. HR: 110 bpm. BP: 100/65 mmHg. SpO2: 95% on room air. Pale, icteric sclerae. Tender long bones. Chest clear. Abdomen: 3cm splenomegaly. No meningism.",
        assessment:
          "Vaso-occlusive crisis (VOC) in known SCD (HbSS). Possible early acute chest syndrome given mild hypoxia. No features of splenic sequestration.",
        plan: "1. IV morphine 5mg stat, then PCA/titrate to pain\n2. IV Normal Saline 1L over 6 hours\n3. Oxygen 2L/min via nasal cannula\n4. Paracetamol 1g IV QDS\n5. FBC, reticulocyte count, LDH, CRP, blood cultures, G&S\n6. CXR if SpO2 drops or respiratory symptoms develop\n7. Continue Hydroxyurea\n8. Haematology review\n9. Folic acid 5mg OD",
        primaryDiagnosis: "D57.0 — Sickle-cell anaemia with crisis",
        secondaryDiagnoses: JSON.stringify(["R50.9 — Fever, unspecified"]),
        status: "SIGNED",
        signedAt: daysAgo(25),
        signedById: doctorUsers[4].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[6].profileId,
        encounterId: enc5.id,
        recordedById: doctorUsers[4].profileId,
        recordedAt: daysAgo(25),
        systolicBP: 100,
        diastolicBP: 65,
        heartRate: 110,
        respiratoryRate: 22,
        temperature: 37.9,
        oxygenSat: 95.0,
        weight: 55.0,
        height: 162.0,
        bmi: 21.0,
      },
    });

    await prisma.prescription.create({
      data: {
        encounterId: enc5.id,
        patientId: patientUsers[6].profileId,
        prescribedById: doctorUsers[4].profileId,
        rxNumber: "DFC-RX-2026-0105",
        status: "DISPENSED",
        dispensedAt: daysAgo(25),
        expiresAt: daysAgo(18),
        items: {
          create: [
            { drugName: "Morphine Sulphate", dose: "5mg", form: "Injection", route: "IV", frequency: "4-6 hourly PRN", duration: "While in pain", quantity: "20 ampoules", instructions: "Administer slowly IV. Monitor RR and sedation." },
            { drugName: "Paracetamol", dose: "1g", form: "IV infusion", route: "IV", frequency: "Every 6 hours", duration: "3 days", quantity: "12 vials", instructions: "Infuse over 15 minutes." },
            { drugName: "Hydroxyurea", dose: "500mg", form: "Capsule", route: "PO", frequency: "Once daily", duration: "Ongoing", quantity: "30 capsules", instructions: "Continue long-term as prescribed. FBC monitoring required." },
            { drugName: "Folic Acid", dose: "5mg", form: "Tablet", route: "PO", frequency: "Once daily", duration: "Ongoing", quantity: "30 tablets", instructions: "Take daily for red cell production." },
          ],
        },
      },
    });

    // Scenario 6: HIV patient on TLD (Patient 5, Doctor 1 — Internal Medicine)
    const enc6 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[5].profileId,
        doctorId: doctorUsers[1].profileId,
        encounterType: "FOLLOW_UP",
        encounterDate: daysAgo(28),
        chiefComplaint: "Routine HIV follow-up — viral load check",
        subjective:
          "Known HIV-positive for 8 years, on TLD (Tenofovir/Lamivudine/Dolutegravir) for 3 years. Good adherence (pill count >95%). No new symptoms. Weight stable. Appetite good. No opportunistic infections. Sexually active with wife — using condoms consistently. Wife HIV-negative on PrEP.",
        objective:
          "BP: 126/80 mmHg. BMI: 24.1. No lymphadenopathy. Oral cavity clear — no thrush. Chest clear. Abdomen soft, no hepatosplenomegaly. No skin lesions.",
        assessment:
          "HIV infection on ART — virologically suppressed. Clinically stable, WHO Stage 1.",
        plan: "1. Continue TLD (Tenofovir 300mg/Lamivudine 300mg/Dolutegravir 50mg) OD\n2. Viral load, CD4 count, FBC, LFT, RFT, fasting lipids\n3. CrCl calculation (Tenofovir nephrotoxicity monitoring)\n4. Hepatitis B surface antigen (due for repeat)\n5. Review in 6 months with results\n6. Encourage continued condom use and PrEP adherence for wife",
        primaryDiagnosis: "B20 — HIV disease",
        status: "SIGNED",
        signedAt: daysAgo(28),
        signedById: doctorUsers[1].profileId,
        isConfidential: true,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[5].profileId,
        encounterId: enc6.id,
        recordedById: doctorUsers[1].profileId,
        recordedAt: daysAgo(28),
        systolicBP: 126,
        diastolicBP: 80,
        heartRate: 68,
        respiratoryRate: 14,
        temperature: 36.5,
        oxygenSat: 99.0,
        weight: 76.0,
        height: 178.0,
        bmi: 24.1,
      },
    });

    const inv6a = await prisma.investigationOrder.create({
      data: {
        encounterId: enc6.id,
        patientId: patientUsers[5].profileId,
        orderedById: doctorUsers[1].profileId,
        type: "LAB",
        name: "HIV Viral Load and CD4",
        urgency: "ROUTINE",
        status: "RESULTED",
        resultedAt: daysAgo(25),
      },
    });

    await prisma.labResult.create({
      data: {
        patientId: patientUsers[5].profileId,
        investigationId: inv6a.id,
        uploadedById: doctorUsers[1].profileId,
        testName: "HIV Viral Load and CD4",
        labName: "NHA Virology Lab",
        reportDate: daysAgo(25),
        results: JSON.stringify([
          { test: "HIV-1 Viral Load", value: "<20", unit: "copies/mL", refRange: "<20 (undetectable)", flag: "NORMAL" },
          { test: "CD4 Count", value: "654", unit: "cells/uL", refRange: ">500", flag: "NORMAL" },
          { test: "CD4 Percentage", value: "34", unit: "%", refRange: ">25", flag: "NORMAL" },
        ]),
        interpretation: "Viral load undetectable — excellent suppression on TLD. CD4 count within normal range. Continue current regimen.",
        isAbnormal: false,
        reviewedById: doctorUsers[1].profileId,
        reviewedAt: daysAgo(24),
      },
    });

    // Scenario 7: Peptic ulcer disease (Patient 2, Doctor 12 — Gastroenterology... but using Doctor 8 Nephrology as proxy, reassigning to available)
    // Using Doctor 12 (Gastroenterology) — index 12
    const enc7 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[2].profileId,
        doctorId: doctorUsers[12].profileId,
        encounterType: "CONSULTATION",
        encounterDate: daysAgo(38),
        chiefComplaint: "Recurrent epigastric pain, worse on empty stomach",
        subjective:
          "3-month history of burning epigastric pain, worse on empty stomach and at night. Relieved by eating and antacids. Associated with bloating, early satiety, occasional nausea. No vomiting of blood or melaena. H. pylori positive on stool antigen test at referring facility. No NSAID use. Non-smoker.",
        objective:
          "BP: 132/84 mmHg. Abdomen: mild epigastric tenderness, no guarding, no rebound. No masses. Bowels sounds normal. DRE: no melaena.",
        assessment:
          "Peptic ulcer disease — likely duodenal ulcer. H. pylori positive. No features of complication (perforation/bleeding).",
        plan: "1. H. pylori triple therapy:\n   - Omeprazole 20mg BD x 14 days\n   - Amoxicillin 1g BD x 14 days\n   - Clarithromycin 500mg BD x 14 days\n2. Continue Omeprazole 20mg OD for 4 more weeks after eradication\n3. Avoid spicy food, alcohol\n4. Stool H. pylori antigen test 4 weeks after completing antibiotics\n5. OGD if symptoms persist after eradication",
        primaryDiagnosis: "K26.9 — Duodenal ulcer, unspecified",
        secondaryDiagnoses: JSON.stringify(["B96.81 — Helicobacter pylori infection"]),
        status: "SIGNED",
        signedAt: daysAgo(38),
        signedById: doctorUsers[12].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[2].profileId,
        encounterId: enc7.id,
        recordedById: doctorUsers[12].profileId,
        recordedAt: daysAgo(38),
        systolicBP: 132,
        diastolicBP: 84,
        heartRate: 78,
        respiratoryRate: 16,
        temperature: 36.7,
        oxygenSat: 99.0,
        weight: 68.0,
        height: 158.0,
        bmi: 27.2,
      },
    });

    await prisma.prescription.create({
      data: {
        encounterId: enc7.id,
        patientId: patientUsers[2].profileId,
        prescribedById: doctorUsers[12].profileId,
        rxNumber: "DFC-RX-2026-0107",
        status: "DISPENSED",
        dispensedAt: daysAgo(38),
        expiresAt: daysAgo(10),
        items: {
          create: [
            { drugName: "Omeprazole", dose: "20mg", form: "Capsule", route: "PO", frequency: "Twice daily", duration: "14 days then 20mg OD x 4 weeks", quantity: "56 capsules", instructions: "Take 30 minutes before meals" },
            { drugName: "Amoxicillin", dose: "1000mg", form: "Capsule", route: "PO", frequency: "Twice daily", duration: "14 days", quantity: "28 capsules", instructions: "Take with meals. Complete the full course." },
            { drugName: "Clarithromycin", dose: "500mg", form: "Tablet", route: "PO", frequency: "Twice daily", duration: "14 days", quantity: "28 tablets", instructions: "Take with meals. May cause metallic taste — temporary." },
          ],
        },
      },
    });

    // Scenario 8: Asthma exacerbation (Patient 7, Doctor 10 — Pulmonology)
    const enc8 = await prisma.clinicalEncounter.create({
      data: {
        patientId: patientUsers[7].profileId,
        doctorId: doctorUsers[10].profileId,
        encounterType: "CONSULTATION",
        encounterDate: daysAgo(20),
        chiefComplaint: "Worsening breathlessness and wheeze for 5 days",
        subjective:
          "Known asthmatic for 15 years, usually well-controlled on Salbutamol PRN. Over the past 5 days: increasing wheeze, SOB, nocturnal cough (waking 3-4 times/night), using Salbutamol 6-8 times daily with partial relief. Triggered by harmattan dust. No fever, no sputum production. Not on preventer inhaler.",
        objective:
          "SpO2: 94% on room air. RR: 24/min. HR: 98 bpm. Widespread expiratory wheeze bilaterally. Using accessory muscles. PEFR: 55% predicted (220/400 L/min). No cyanosis.",
        assessment:
          "Acute moderate asthma exacerbation. Undertreated — no preventer therapy. Harmattan trigger.",
        plan: "1. Salbutamol nebulisation 5mg stat, repeat in 20 mins x 3\n2. Ipratropium 500mcg nebulised with first dose\n3. Prednisolone 40mg PO OD x 5 days\n4. Start Beclometasone 200mcg BD (preventer) — long-term\n5. Continue Salbutamol 200mcg PRN (max 4-hourly)\n6. Spacer technique education\n7. Asthma action plan\n8. Review PEFR after nebulisation — if <60%, admit\n9. Follow-up in 1 week",
        primaryDiagnosis: "J45.1 — Non-allergic asthma with acute exacerbation",
        status: "SIGNED",
        signedAt: daysAgo(20),
        signedById: doctorUsers[10].profileId,
      },
    });

    await prisma.vitalSign.create({
      data: {
        patientId: patientUsers[7].profileId,
        encounterId: enc8.id,
        recordedById: doctorUsers[10].profileId,
        recordedAt: daysAgo(20),
        systolicBP: 130,
        diastolicBP: 82,
        heartRate: 98,
        respiratoryRate: 24,
        temperature: 36.8,
        oxygenSat: 94.0,
        weight: 85.0,
        height: 172.0,
        bmi: 28.7,
      },
    });

    await prisma.prescription.create({
      data: {
        encounterId: enc8.id,
        patientId: patientUsers[7].profileId,
        prescribedById: doctorUsers[10].profileId,
        rxNumber: "DFC-RX-2026-0108",
        status: "ACTIVE",
        expiresAt: daysFromNow(70),
        items: {
          create: [
            { drugName: "Prednisolone", dose: "40mg", form: "Tablet", route: "PO", frequency: "Once daily", duration: "5 days", quantity: "5 tablets", instructions: "Take in the morning with food. Do not stop abruptly if on for longer." },
            { drugName: "Beclometasone MDI", dose: "200mcg", form: "Inhaler", route: "INH", frequency: "Twice daily", duration: "Ongoing", quantity: "1 inhaler (200 doses)", instructions: "Use with spacer. Rinse mouth after each use to prevent oral thrush." },
            { drugName: "Salbutamol MDI", dose: "200mcg", form: "Inhaler", route: "INH", frequency: "PRN (max 4-hourly)", duration: "Ongoing", quantity: "1 inhaler (200 doses)", instructions: "Use for rescue. If needing >3 times/week, preventer may need stepping up." },
          ],
        },
      },
    });

    console.log("  Created 8 clinical encounters with vitals, prescriptions, investigations");

    // ── Problem lists ───────────────────────────────────────────────────
    const problems = [
      { patientId: patientUsers[0].profileId, addedById: doctorUsers[0].profileId, problem: "Essential Hypertension", icdCode: "I10", status: "ACTIVE", onsetDate: daysAgo(365 * 3) },
      { patientId: patientUsers[0].profileId, addedById: doctorUsers[0].profileId, problem: "Hypertensive retinopathy Grade I", icdCode: "H35.0", status: "ACTIVE", onsetDate: daysAgo(45) },
      { patientId: patientUsers[5].profileId, addedById: doctorUsers[1].profileId, problem: "HIV disease", icdCode: "B20", status: "ACTIVE", onsetDate: daysAgo(365 * 8), notes: "On TLD — virologically suppressed" },
      { patientId: patientUsers[6].profileId, addedById: doctorUsers[4].profileId, problem: "Sickle cell anaemia (HbSS)", icdCode: "D57.1", status: "ACTIVE", onsetDate: daysAgo(365 * 28), notes: "Diagnosed in infancy. On Hydroxyurea." },
      { patientId: patientUsers[8].profileId, addedById: doctorUsers[11].profileId, problem: "Type 2 diabetes mellitus", icdCode: "E11.9", status: "ACTIVE", onsetDate: daysAgo(365 * 5) },
      { patientId: patientUsers[7].profileId, addedById: doctorUsers[10].profileId, problem: "Bronchial asthma", icdCode: "J45.9", status: "ACTIVE", onsetDate: daysAgo(365 * 15) },
      { patientId: patientUsers[2].profileId, addedById: doctorUsers[12].profileId, problem: "Peptic ulcer disease — duodenal", icdCode: "K26.9", status: "ACTIVE", onsetDate: daysAgo(90) },
      { patientId: patientUsers[4].profileId, addedById: doctorUsers[3].profileId, problem: "Pregnancy — 24 weeks", icdCode: "Z34.0", status: "ACTIVE", onsetDate: daysAgo(168) },
    ];

    for (const p of problems) {
      await prisma.patientProblem.create({ data: p });
    }
    console.log("  Created 8 problem list entries");

    // ── Patient allergies (structured) ──────────────────────────────────
    const allergies = [
      { patientId: patientUsers[0].profileId, addedById: doctorUsers[0].profileId, allergen: "Aspirin", allergyType: "DRUG", reaction: "Gastric bleeding", severity: "SEVERE", status: "ACTIVE" },
      { patientId: patientUsers[2].profileId, addedById: doctorUsers[12].profileId, allergen: "Penicillin", allergyType: "DRUG", reaction: "Maculopapular rash", severity: "MODERATE", status: "ACTIVE" },
      { patientId: patientUsers[4].profileId, addedById: doctorUsers[3].profileId, allergen: "Chloroquine", allergyType: "DRUG", reaction: "Severe pruritus", severity: "MODERATE", status: "ACTIVE" },
      { patientId: patientUsers[5].profileId, addedById: doctorUsers[1].profileId, allergen: "Nevirapine", allergyType: "DRUG", reaction: "Stevens-Johnson Syndrome", severity: "LIFE_THREATENING", status: "ACTIVE", notes: "Documented SJS with Nevirapine. Never use NVP-based regimens." },
      { patientId: patientUsers[7].profileId, addedById: doctorUsers[10].profileId, allergen: "Dust mites", allergyType: "ENVIRONMENTAL", reaction: "Bronchospasm and wheeze", severity: "SEVERE", status: "ACTIVE" },
      { patientId: patientUsers[7].profileId, addedById: doctorUsers[10].profileId, allergen: "NSAIDs", allergyType: "DRUG", reaction: "Bronchospasm — aspirin-exacerbated respiratory disease", severity: "SEVERE", status: "ACTIVE" },
      { patientId: patientUsers[9].profileId, addedById: doctorUsers[9].profileId, allergen: "Latex", allergyType: "ENVIRONMENTAL", reaction: "Contact urticaria", severity: "MODERATE", status: "ACTIVE" },
    ];

    for (const a of allergies) {
      await prisma.patientAllergy.create({ data: a });
    }
    console.log("  Created 7 allergy records");

    // ── Patient medications ─────────────────────────────────────────────
    const medications = [
      { patientId: patientUsers[0].profileId, prescribedById: doctorUsers[0].profileId, drugName: "Amlodipine", dose: "10mg", frequency: "Once daily", route: "PO", indication: "Hypertension", status: "ACTIVE", startDate: daysAgo(365) },
      { patientId: patientUsers[0].profileId, prescribedById: doctorUsers[0].profileId, drugName: "Losartan", dose: "100mg", frequency: "Once daily", route: "PO", indication: "Hypertension", status: "ACTIVE", startDate: daysAgo(45) },
      { patientId: patientUsers[5].profileId, prescribedById: doctorUsers[1].profileId, drugName: "TLD (Tenofovir/Lamivudine/Dolutegravir)", dose: "300/300/50mg", frequency: "Once daily", route: "PO", indication: "HIV — ART", status: "ACTIVE", startDate: daysAgo(365 * 3) },
      { patientId: patientUsers[6].profileId, prescribedById: doctorUsers[4].profileId, drugName: "Hydroxyurea", dose: "500mg", frequency: "Once daily", route: "PO", indication: "Sickle cell disease — crisis prevention", status: "ACTIVE", startDate: daysAgo(365 * 2) },
      { patientId: patientUsers[6].profileId, prescribedById: doctorUsers[4].profileId, drugName: "Folic Acid", dose: "5mg", frequency: "Once daily", route: "PO", indication: "Chronic haemolysis", status: "ACTIVE", startDate: daysAgo(365 * 5) },
      { patientId: patientUsers[8].profileId, prescribedById: doctorUsers[11].profileId, drugName: "Metformin", dose: "1000mg", frequency: "Twice daily", route: "PO", indication: "Type 2 diabetes mellitus", status: "ACTIVE", startDate: daysAgo(365 * 5) },
      { patientId: patientUsers[8].profileId, prescribedById: doctorUsers[11].profileId, drugName: "Glimepiride", dose: "1mg", frequency: "Once daily", route: "PO", indication: "Type 2 diabetes mellitus", status: "ACTIVE", startDate: daysAgo(18), notes: "Reduced from 2mg due to hypoglycaemia" },
      { patientId: patientUsers[7].profileId, prescribedById: doctorUsers[10].profileId, drugName: "Beclometasone MDI", dose: "200mcg", frequency: "Twice daily", route: "INH", indication: "Asthma preventer", status: "ACTIVE", startDate: daysAgo(20) },
      { patientId: patientUsers[7].profileId, prescribedById: doctorUsers[10].profileId, drugName: "Salbutamol MDI", dose: "200mcg", frequency: "PRN", route: "INH", indication: "Asthma rescue", status: "ACTIVE", startDate: daysAgo(365 * 10) },
    ];

    for (const m of medications) {
      await prisma.patientMedication.create({ data: m });
    }
    console.log("  Created 9 medication records");
  } else {
    console.log("\n  EMR data already seeded, skipping");
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\nTest data seeding complete!\n");
  console.log("Test Accounts:");
  console.log("  Doctors (15):");
  for (const doc of doctorsData) {
    console.log(`    ${doc.title} ${doc.firstName} ${doc.lastName} — ${doc.specialty} — ${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@dfc.ng / doctor123`);
  }
  console.log("\n  Patients (20):");
  for (const pat of patientsData) {
    console.log(`    ${pat.firstName} ${pat.lastName} — ${pat.city} — ${pat.firstName.toLowerCase()}.${pat.lastName.toLowerCase()}@patient.dfc.ng / patient123`);
  }
  console.log("\n  Appointments: 30 (10 completed, 8 confirmed, 7 pending, 3 cancelled, 2 no-show)");
  console.log("  EMR: 8 encounters, vitals, prescriptions, investigations, problem lists, allergies, medications");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
