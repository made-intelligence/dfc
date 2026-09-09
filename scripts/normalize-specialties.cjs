/**
 * Align the Specialty table with the canonical list in src/lib/specialties.ts.
 *
 * Specialty rows drifted from the canonical names (American spellings, short
 * forms), so a search for the canonical label matched nothing and the doctors
 * behind those rows were only reachable via the pill row or free-text search.
 *
 * SAFETY: dry-run by default. Never deletes a row that still has doctors.
 *   node scripts/normalize-specialties.cjs            # preview only
 *   node scripts/normalize-specialties.cjs --commit   # apply
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--commit');

// Drifted name -> canonical name from src/lib/specialties.ts.
const RENAMES = {
  Orthopedics: 'Orthopaedic Surgery',
  'General Practice': 'Family Medicine / General Practice',
};

// Duplicate spellings of the same specialty: { keep, drop }.
const MERGES = [{ keep: 'Paediatrics', drop: 'Pediatrics' }];

async function main() {
  console.log(`\n=== specialty normalisation === mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'COMMIT'}\n`);
  const summary = { renamed: 0, merged: 0, deleted: 0, skipped: 0 };

  for (const [from, to] of Object.entries(RENAMES)) {
    const row = await prisma.specialty.findFirst({
      where: { name: from },
      include: { _count: { select: { doctors: true } } },
    });
    if (!row) {
      console.log(`[skip]   "${from}" not present`);
      summary.skipped++;
      continue;
    }
    const clash = await prisma.specialty.findFirst({ where: { name: to } });
    if (clash) {
      // Renaming would collide; treat it as a merge instead of guessing.
      console.log(`[skip]   "${from}" -> "${to}" would collide with an existing row; merge manually`);
      summary.skipped++;
      continue;
    }
    console.log(`[rename] "${from}" -> "${to}" (${row._count.doctors} doctors)`);
    if (!DRY_RUN) {
      await prisma.specialty.update({ where: { id: row.id }, data: { name: to } });
    }
    summary.renamed++;
  }

  for (const { keep, drop } of MERGES) {
    const keepRow = await prisma.specialty.findFirst({ where: { name: keep } });
    const dropRow = await prisma.specialty.findFirst({
      where: { name: drop },
      include: { _count: { select: { doctors: true } } },
    });
    if (!keepRow || !dropRow) {
      console.log(`[skip]   merge "${drop}" -> "${keep}": one side missing`);
      summary.skipped++;
      continue;
    }

    const moving = dropRow._count.doctors;
    if (moving > 0) {
      console.log(`[merge]  ${moving} doctor(s) "${drop}" -> "${keep}"`);
      if (!DRY_RUN) {
        await prisma.doctorProfile.updateMany({
          where: { specialtyId: dropRow.id },
          data: { specialtyId: keepRow.id },
        });
      }
      summary.merged += moving;
    }

    if (DRY_RUN) {
      console.log(`[delete] "${drop}" (after moving ${moving} doctor(s))`);
      summary.deleted++;
      continue;
    }

    // DoctorProfile.specialty cascades on delete, so re-check emptiness against
    // the database immediately before removing the row. Never delete a row that
    // still has doctors attached: that would delete the doctors too.
    const remaining = await prisma.doctorProfile.count({ where: { specialtyId: dropRow.id } });
    if (remaining > 0) {
      console.log(`[abort]  "${drop}" still has ${remaining} doctor(s); leaving it in place`);
      summary.skipped++;
      continue;
    }
    await prisma.specialty.delete({ where: { id: dropRow.id } });
    console.log(`[delete] "${drop}"`);
    summary.deleted++;
  }

  console.log('\n=== summary ===');
  console.log(summary);
  if (DRY_RUN) console.log('\nNo changes written. Re-run with --commit to apply.');
}

main()
  .catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
