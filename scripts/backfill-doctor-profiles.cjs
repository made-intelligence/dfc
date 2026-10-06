/**
 * Give every DFC member a DoctorProfile.
 *
 * DFC members are doctors, but the member import created only User and
 * DFCMember rows. Both search surfaces read DoctorProfile, so a member without
 * one is invisible: 85 of 96 members could not be found at all.
 *
 * Creates the missing profile rows, mirroring how registration builds a slug.
 * Does not invent clinical facts: the import carried only name and email, so
 * specialty, institution and bio are left empty for the member (or the
 * secretariat) to fill in. Those members become findable by name immediately
 * and by specialty once it is entered.
 *
 * SAFETY: dry-run by default.
 *   node scripts/backfill-doctor-profiles.cjs
 *   node scripts/backfill-doctor-profiles.cjs --commit
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();
const COMMIT = process.argv.includes('--commit');

function slugify(name) {
  return (name || 'member')
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function doctorSlug(name, suffix) {
  const base = `dr-${slugify(name)}`;
  return suffix ? `${base}-${suffix}` : base;
}

async function main() {
  const members = await prisma.dFCMember.findMany({
    select: {
      id: true, status: true,
      user: {
        select: {
          id: true, name: true, email: true,
          doctorProfile: { select: { id: true } },
        },
      },
    },
  });

  const missing = members.filter((m) => m.user && !m.user.doctorProfile);

  console.log('\n=== doctor profile backfill ===');
  console.log(`mode   : ${COMMIT ? 'COMMIT' : 'DRY-RUN (no writes)'}`);
  console.log(`members: ${members.length}`);
  console.log(`already have a profile: ${members.length - missing.length}`);
  console.log(`to create             : ${missing.length}\n`);

  const audit = `${os.tmpdir()}/dfc-backfill-profiles-${Date.now()}.json`;
  fs.writeFileSync(audit, JSON.stringify(missing.map((m) => m.user), null, 2));
  console.log(`audit written: ${audit}`);

  if (!COMMIT) {
    missing.slice(0, 8).forEach((m) => console.log(`  [would create] ${m.user.name} <${m.user.email}>`));
    if (missing.length > 8) console.log(`  ... and ${missing.length - 8} more`);
    console.log('\nNo changes written. Re-run with --commit.');
    return;
  }

  let created = 0;
  for (const m of missing) {
    try {
      let slug = doctorSlug(m.user.name);
      let counter = 1;
      // eslint-disable-next-line no-await-in-loop
      while (await prisma.doctorProfile.findUnique({ where: { slug } })) {
        slug = doctorSlug(m.user.name, counter++);
      }
      // eslint-disable-next-line no-await-in-loop
      await prisma.doctorProfile.create({
        data: { userId: m.user.id, slug, experience: 0 },
      });
      created++;
    } catch (e) {
      console.log(`  [FAILED] ${m.user.email}: ${e.message.split('\n')[0]}`);
    }
  }

  const total = await prisma.doctorProfile.count();
  console.log(`\ncreated: ${created} / ${missing.length}`);
  console.log(`doctor profiles now: ${total}`);
}

main()
  .catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); })
  .finally(() => prisma.$disconnect());
