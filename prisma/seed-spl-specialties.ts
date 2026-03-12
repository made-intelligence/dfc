import { PrismaClient } from "@prisma/client";

const specialties = [
  // Tier 1 — High-volume (activate first)
  { specialty: "Cardiology", tier: 1, minAnchorCity: 5, minSecondaryCity: 3 },
  { specialty: "Obstetrics & Gynaecology", tier: 1, minAnchorCity: 5, minSecondaryCity: 3 },
  { specialty: "General Surgery", tier: 1, minAnchorCity: 5, minSecondaryCity: 3 },
  { specialty: "Paediatrics", tier: 1, minAnchorCity: 5, minSecondaryCity: 3 },
  { specialty: "Orthopaedics", tier: 1, minAnchorCity: 5, minSecondaryCity: 3 },

  // Tier 2 — Medium-volume
  { specialty: "Gastroenterology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Nephrology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "ENT Surgery", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Ophthalmology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Endocrinology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Dermatology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Haematology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },
  { specialty: "Rheumatology", tier: 2, minAnchorCity: 3, minSecondaryCity: 2 },

  // Tier 3 — Specialist
  { specialty: "Neurology", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Neurosurgery", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Oncology", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Psychiatry / Mental Health", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Plastic Surgery", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Dentistry", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
  { specialty: "Physiotherapy", tier: 3, minAnchorCity: 2, minSecondaryCity: 1 },
];

export async function seedSPLSpecialties(prisma: PrismaClient) {
  console.log(`Seeding ${specialties.length} SPL specialty activations...`);

  for (const spec of specialties) {
    await prisma.sPLSpecialtyActivation.upsert({
      where: { specialty: spec.specialty },
      update: {
        tier: spec.tier,
        minAnchorCity: spec.minAnchorCity,
        minSecondaryCity: spec.minSecondaryCity,
      },
      create: {
        ...spec,
        status: "INACTIVE",
        currentAnchorCount: 0,
        currentSecondaryCount: 0,
      },
    });
  }

  console.log("SPL specialty activations seeded.");
}
