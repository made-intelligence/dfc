import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── MEMBER DATA ──────────────────────────────────────────────────────────────

const MEMBERS = [
  { name: "Ahjoku Amadi-Obi",        email: "ahjoku@gmail.com",                         phone: "+353873872687",  location: "Naas, Ireland",              institution: "Hudibia" },
  { name: "Chizo Agwu",              email: "chizo.agwu@nhs.net",                       phone: "+447713401469",  location: "UK",                         institution: "NHS" },
  { name: "Folake Owodunni",         email: "folake@emergencyresponseafrica.com",        phone: "+2347067776806", location: "Lagos, Nigeria",              institution: "Emergency Response Africa" },
  { name: "Douglas Emeka Okor",      email: "drokor1976@gmail.com",                     phone: "+447728903110",  location: "Abuja, Nigeria",             institution: "Federal Medical Centre Abuja" },
  { name: "Biodun Ogungbo",          email: "biodunogungbo1@gmail.com",                 phone: "+2347082350074", location: "Abuja, Nigeria",             institution: "Brain and Spine Surgery Ltd Abuja" },
  { name: "Aisha Onisarotu",         email: "draisha@theambulancecompany.com",          phone: "+2348138570516", location: "Lagos, Nigeria",              institution: "The Ambulance Company" },
  { name: "Andrew Agun",             email: "andrewagun19@gmail.com",                   phone: "+447875557252",  location: "UK",                         institution: "GP" },
  { name: "Tolu Ekong",              email: "tolu.ekong@gmail.com",                     phone: "+447946180118",  location: "UK",                         institution: "Lister Hospital" },
  { name: "Olufemi Onasanya",        email: "femi@emergencyresponseafrica.com",         phone: "+2348035205505", location: "Lagos, Nigeria",              institution: "Emergency Response Africa" },
  { name: "Sigismund Wilkey",        email: "sigismund.wilkey@nhs.net",                 phone: "+447957286773",  location: "UK",                         institution: "Lister Hospital Stevenage" },
  { name: "Christopher Okunseri",    email: "chris_okunseri@yahoo.com",                 phone: "+16512834237",   location: "Milwaukee, Wisconsin, USA",   institution: "Marquette University School of Dentistry" },
  { name: "Oge Ilegbune",            email: "oilegbune@lakeshorecc.org",                phone: "+2349088451546", location: "Lagos, Nigeria",              institution: "Lakeshore Cancer Center" },
  { name: "Olusegun Apata",          email: "apata@aol.com",                            phone: "+17088192526",   location: "Chicago, Illinois, USA",      institution: "Great Lakes Pulmonary & Sleep Associates" },
  { name: "Kenneth Adegoke",         email: "kenneth.adegoke@gmail.com",                phone: "+2349066463065", location: "Lagos, Nigeria",              institution: "A3C - Anaesthesia & Critical Care Consultants" },
  { name: "Orode Doherty",           email: "orode@ingresshealthpartners.com",          phone: "+2348068349743", location: "Lagos, Nigeria",              institution: "Ingress Health Partners" },
  { name: "Sarah Beckley",           email: "hijeh00@yahoo.com",                        phone: "+447940348922",  location: "Chichester, UK",              institution: "NHS / Nigerian Society of Anaesthetists" },
  { name: "Dayo Ajayi-Obe",          email: "dayoobe@gmail.com",                        phone: "+2348169901524", location: "Lagos, Nigeria",              institution: "Subsaharan Health Solutions Nigeria Limited" },
  { name: "Pamela Ajayi",            email: "pamajayi101@gmail.com",                    phone: "+2348023157937", location: "Lagos, Nigeria",              institution: null },
  { name: "Olusegun Adeoye",         email: "drsegunadeoye@yahoo.com",                  phone: "+2348094496614", location: "Abuja, Nigeria",              institution: "West Africa Health Organisation" },
  { name: "Adekunle Obisesan",       email: "aobisesan@gmail.com",                      phone: "+14438501947",   location: "St. Louis, Missouri, USA",    institution: "St. Luke's Hospital" },
  { name: "Abdulateef Kareem",       email: "oakareem@yahoo.com",                       phone: "+2348162204618", location: "Abuja, Nigeria",              institution: "Federal Ministry of Health" },
  { name: "Joanna Coker",            email: "joannecoker@aol.com",                      phone: "+447702358170",  location: "London, UK",                  institution: "BHRUT UK" },
  { name: "Dami Collier",            email: "damicollier@nomaddoctravelhealth.com",      phone: "+447888707113",  location: "Cambridge, UK",               institution: "Nomad Doc Travel Health" },
  { name: "Femi Ogunremi",           email: "drfemi2000@hotmail.com",                   phone: "+2347038072039", location: "Lagos, Nigeria",              institution: null },
  { name: "Adedoyin Dosunmu-Ogunbi", email: "aogunbi@gmail.com",                        phone: "+2348179362768", location: "Lagos, Nigeria",              institution: "Duchess International Hospital" },
  { name: "Jite Erharhaghen",        email: "jite.erharhaghen@googlemail.com",          phone: "+4915127561270", location: "Bad Saulgau, Germany",        institution: "Physician Group Practice" },
  { name: "Chito Nwana",             email: "fumenyi@hotmail.com",                      phone: "+2348078100310", location: "Abuja, Nigeria",              institution: "Arabella Women's Health & Wellness" },
];

// Board of Trustees members (by email)
const BOT_EMAILS = [
  "joannecoker@aol.com",
  "andrewagun19@gmail.com",
];

// ── PILLAR DATA ──────────────────────────────────────────────────────────────

const PILLARS = [
  {
    order: 1,
    name: "Emergency Referral, Coordination, Technology & Logistics",
    subtitle: "Backbone of the system",
    focus: "Hospital and ambulance onboarding. 24/7 emergency contact system. Referral criteria and acceptance processes. Coordination hub or call centre. Communication tools and workflows. Ambulance equipment standards, medical supplies, stocking, maintenance, distribution.",
    outputs: "Participating facility and ambulance directory. Emergency contact roster. Referral and coordination SOPs. Logistics and equipment readiness checklist. Ambulance and response asset standards.",
  },
  {
    order: 2,
    name: "Community Engagement, Communication & Civil Society Partnerships",
    subtitle: "System activation and trust",
    focus: "Community education and preparedness. Knowing who to call, what to do, and what not to do. Local first response and bystander action. Partnerships with CSOs, faith-based groups, transport unions, community leaders. Identification of existing community and informal referral networks.",
    outputs: "Community engagement protocols and roadmaps. Public education materials. Communication initiatives via local, social, and contemporary media. Civil society partnership framework.",
  },
  {
    order: 3,
    name: "Emergency Workforce Training & Preparedness",
    subtitle: "People make the system work",
    focus: "First responder and ambulance staff training. Basic life support and trauma response. Hospital receiving team readiness. BLS, ACLS, PALS workflows. Simulation drills and preparedness exercises.",
    outputs: "Training curricula and schedules. Skills checklists and certification pathways. Hospital and responder preparedness standards.",
  },
  {
    order: 4,
    name: "Gap Analysis, Data Collection & Monitoring",
    subtitle: "Evidence and accountability",
    focus: "Baseline gap analysis across the emergency response pathway. Data on response times, referrals, logistics readiness, training gaps, outcomes. Review of existing government emergency response data and systems. Continuous monitoring and quality improvement.",
    outputs: "Gap analysis framework and reports. Data collection tools. Dashboards and performance indicators.",
  },
  {
    order: 5,
    name: "Financing, Reimbursement & Sustainability",
    subtitle: "The engine that keeps it running",
    focus: "Emergency care costing. Reimbursement pathways for ambulances and hospitals. NHIS, HMO, insurance, donor, and PPP engagement. Funding models for logistics, training, and coordination.",
    outputs: "Emergency reimbursement framework. Funding and donor engagement strategy. Sustainability plan.",
  },
  {
    order: 6,
    name: "Governance, Partnerships & Scale",
    subtitle: "Making it last and grow",
    focus: "Oversight and accountability. Government engagement and alignment. Policy integration. Scale-up across states and nationally.",
    outputs: "Governance and decision-making framework. Partnership agreements. Scale-up and national adoption roadmap.",
  },
];

// ── PILLAR MEMBERSHIP ────────────────────────────────────────────────────────

const PILLAR_MEMBERS: Record<number, { email: string; role: string }[]> = {
  1: [
    { email: "femi@emergencyresponseafrica.com",        role: "CO_LEAD" },
    { email: "ahjoku@gmail.com",                         role: "MEMBER" },
    { email: "chizo.agwu@nhs.net",                       role: "MEMBER" },
    { email: "folake@emergencyresponseafrica.com",        role: "MEMBER" },
    { email: "drokor1976@gmail.com",                      role: "MEMBER" },
    { email: "biodunogungbo1@gmail.com",                  role: "MEMBER" },
    { email: "draisha@theambulancecompany.com",           role: "MEMBER" },
    { email: "andrewagun19@gmail.com",                    role: "MEMBER" },
    { email: "tolu.ekong@gmail.com",                      role: "MEMBER" },
    { email: "sigismund.wilkey@nhs.net",                  role: "MEMBER" },
  ],
  2: [
    { email: "kenneth.adegoke@gmail.com",                 role: "CO_LEAD" },
    { email: "apata@aol.com",                             role: "CO_LEAD" },
    { email: "chris_okunseri@yahoo.com",                  role: "MEMBER" },
    { email: "oilegbune@lakeshorecc.org",                 role: "MEMBER" },
    { email: "folake@emergencyresponseafrica.com",        role: "MEMBER" },
    { email: "drokor1976@gmail.com",                      role: "MEMBER" },
    { email: "biodunogungbo1@gmail.com",                  role: "MEMBER" },
    { email: "orode@ingresshealthpartners.com",           role: "MEMBER" },
    { email: "hijeh00@yahoo.com",                         role: "MEMBER" },
    { email: "dayoobe@gmail.com",                         role: "MEMBER" },
    { email: "pamajayi101@gmail.com",                     role: "MEMBER" },
  ],
  3: [
    { email: "kenneth.adegoke@gmail.com",                 role: "CO_LEAD" },
    { email: "drsegunadeoye@yahoo.com",                   role: "MEMBER" },
    { email: "oilegbune@lakeshorecc.org",                 role: "MEMBER" },
    { email: "folake@emergencyresponseafrica.com",        role: "MEMBER" },
    { email: "drokor1976@gmail.com",                      role: "MEMBER" },
    { email: "biodunogungbo1@gmail.com",                  role: "MEMBER" },
    { email: "aobisesan@gmail.com",                       role: "MEMBER" },
    { email: "oakareem@yahoo.com",                        role: "ADVISOR" },
    { email: "joannecoker@aol.com",                       role: "MEMBER" },
    { email: "hijeh00@yahoo.com",                         role: "MEMBER" },
    { email: "dayoobe@gmail.com",                         role: "MEMBER" },
  ],
  4: [
    { email: "damicollier@nomaddoctravelhealth.com",      role: "CO_LEAD" },
    { email: "orode@ingresshealthpartners.com",           role: "MEMBER" },
    { email: "folake@emergencyresponseafrica.com",        role: "MEMBER" },
    { email: "draisha@theambulancecompany.com",           role: "MEMBER" },
    { email: "drfemi2000@hotmail.com",                    role: "MEMBER" },
    { email: "sigismund.wilkey@nhs.net",                  role: "MEMBER" },
  ],
  5: [
    { email: "damicollier@nomaddoctravelhealth.com",      role: "CO_LEAD" },
    { email: "fumenyi@hotmail.com",                       role: "MEMBER" },
  ],
  6: [
    { email: "aogunbi@gmail.com",                         role: "LEAD" },
    { email: "dayoobe@gmail.com",                         role: "MEMBER" },
    { email: "folake@emergencyresponseafrica.com",        role: "MEMBER" },
    { email: "hijeh00@yahoo.com",                         role: "MEMBER" },
    { email: "jite.erharhaghen@googlemail.com",           role: "MEMBER" },
    { email: "chizo.agwu@nhs.net",                        role: "MEMBER" },
    { email: "oakareem@yahoo.com",                        role: "ADVISOR" },
    { email: "oilegbune@lakeshorecc.org",                 role: "MEMBER" },
    { email: "drokor1976@gmail.com",                      role: "MEMBER" },
    { email: "pamajayi101@gmail.com",                     role: "MEMBER" },
  ],
};

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Emergency Response Initiative...\n");

  const hashedPassword = bcrypt.hashSync("DFC@Change2026!", 10);

  // ── STEP 1: Upsert Users and DFCMembers ──────────────────────────────────

  const userMap = new Map<string, string>(); // email → userId
  const memberMap = new Map<string, string>(); // email → dfcMemberId
  let usersCreated = 0;
  let usersUpdated = 0;

  for (const m of MEMBERS) {
    const email = m.email.toLowerCase();
    const isBotMember = BOT_EMAILS.includes(email);

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: m.name,
        role: "PATIENT",
        password: hashedPassword,
        phone: m.phone,
        isActive: true,
      },
      update: {
        name: m.name,
        phone: m.phone,
      },
    });

    // Track whether it was a create or update
    const isNew = user.createdAt.getTime() > Date.now() - 5000;
    if (isNew) usersCreated++;
    else usersUpdated++;

    userMap.set(email, user.id);

    const dfcMember = await prisma.dFCMember.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        category: "MEMBER",
        status: "ACTIVE",
        goodStanding: false,
        institution: m.institution,
        whatsappOptIn: true,
        isBotMember,
      },
      update: {
        institution: m.institution,
        ...(isBotMember ? { isBotMember: true } : {}),
      },
    });

    memberMap.set(email, dfcMember.id);
  }

  console.log(`Users: ${usersCreated} created, ${usersUpdated} updated`);
  console.log(`DFCMembers: ${memberMap.size} total`);

  // ── STEP 2: Upsert the Initiative ────────────────────────────────────────

  const initiative = await prisma.initiative.upsert({
    where: { name: "Emergency Response Initiative" },
    create: {
      name: "Emergency Response Initiative",
      description: "A six-pillar technical working group developing Nigeria's national emergency response policy framework.",
      type: "TWG",
      status: "ACTIVE",
      remit: "Catalysed by the road traffic accident involving Anthony Joshua in early 2026, the ERI focuses on pre-hospital care, workforce training, community engagement, data collection, financing, and governance. The goal is to produce actionable policy outputs, engage the Federal Ministry of Health, and build a replicable emergency response model for Nigeria.",
      expectedOutputs: "National emergency response policy framework, referral SOPs, training curricula, financing strategy, government engagement roadmap.",
      startDate: new Date("2026-02-01"),
    },
    update: {
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  console.log(`Initiative: ${initiative.name} (${initiative.id})`);

  // ── STEP 3: Upsert InitiativePillars ─────────────────────────────────────

  const pillarMap = new Map<number, string>(); // order → pillarId

  for (const p of PILLARS) {
    const pillar = await prisma.initiativePillar.upsert({
      where: {
        initiativeId_name: {
          initiativeId: initiative.id,
          name: p.name,
        },
      },
      create: {
        initiativeId: initiative.id,
        name: p.name,
        subtitle: p.subtitle,
        focus: p.focus,
        outputs: p.outputs,
        order: p.order,
      },
      update: {
        subtitle: p.subtitle,
        focus: p.focus,
        outputs: p.outputs,
        order: p.order,
      },
    });
    pillarMap.set(p.order, pillar.id);
  }

  console.log(`Pillars: ${pillarMap.size} upserted`);

  // ── STEP 4: Create InitiativeMember records ──────────────────────────────

  let membershipsCreated = 0;
  let membershipsSkipped = 0;

  for (const [pillarOrder, assignments] of Object.entries(PILLAR_MEMBERS)) {
    const pillarId = pillarMap.get(Number(pillarOrder));
    if (!pillarId) {
      console.error(`Pillar ${pillarOrder} not found!`);
      continue;
    }

    for (const assignment of assignments) {
      const email = assignment.email.toLowerCase();
      const dfcMemberId = memberMap.get(email);
      if (!dfcMemberId) {
        console.error(`DFCMember not found for ${email}`);
        continue;
      }

      // Check if membership already exists
      const existing = await prisma.initiativeMember.findFirst({
        where: {
          initiativeId: initiative.id,
          dfcMemberId,
          pillarId,
        },
      });

      if (existing) {
        // Update role if changed
        if (existing.role !== assignment.role) {
          await prisma.initiativeMember.update({
            where: { id: existing.id },
            data: { role: assignment.role },
          });
        }
        membershipsSkipped++;
      } else {
        await prisma.initiativeMember.create({
          data: {
            initiativeId: initiative.id,
            dfcMemberId,
            pillarId,
            role: assignment.role,
          },
        });
        membershipsCreated++;
      }
    }
  }

  console.log(`InitiativeMembers: ${membershipsCreated} created, ${membershipsSkipped} already existed`);

  // ── STEP 5: Verification ─────────────────────────────────────────────────

  const result = await prisma.initiative.findFirst({
    where: { name: "Emergency Response Initiative" },
    include: {
      pillars: {
        orderBy: { order: "asc" },
        include: { members: { include: { dfcMember: { include: { user: true } } } } },
      },
    },
  });

  console.log("\n=== VERIFICATION ===");
  console.log(`Initiative: ${result?.name} (${result?.status})`);
  result?.pillars.forEach((p) => {
    const leads = p.members.filter((m) => ["CO_LEAD", "LEAD"].includes(m.role));
    const advisors = p.members.filter((m) => m.role === "ADVISOR");
    console.log(`  Pillar ${p.order}: ${p.name}`);
    console.log(`    ${p.members.length} member(s) | ${leads.length} lead(s) | ${advisors.length} advisor(s)`);
    leads.forEach((l) => console.log(`      [${l.role}] ${l.dfcMember.user.name}`));
  });

  // Verify BoT members
  const botMembers = await prisma.dFCMember.findMany({
    where: { isBotMember: true },
    include: { user: true },
  });
  console.log(`\nBoard of Trustees members: ${botMembers.map((b) => b.user.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
