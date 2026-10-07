/**
 * Collapse duplicate listings where one person holds two member accounts.
 *
 * Only the explicit pairs below are touched, decided by hand after reviewing
 * every repeated surname. Same-surname-different-person cases (the Adegokes,
 * the Alagbes, the Dosunmu-Ogunbis) are deliberately absent.
 *
 * It removes the DoctorProfile from the thinner account, which takes it out of
 * both search surfaces, and leaves the User and DFCMember rows untouched so
 * nobody loses a login or their membership record. Reversible: the profile can
 * be recreated by scripts/backfill-doctor-profiles.cjs.
 *
 * SAFETY: dry-run by default.
 *   node scripts/dedupe-member-listings.cjs
 *   node scripts/dedupe-member-listings.cjs --commit
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();
const COMMIT = process.argv.includes('--commit');

const PAIRS = [
  {
    person: 'Henry Ojigbani',
    keep: 'henry@priscillaspecialist.com',   // activated
    hide: 'ojigba@yahoo.com',                // never activated, empty
  },
  {
    person: 'Taohid Oshodi',
    keep: 'deleoshodi@mac.com',              // activated, has a specialty
    hide: 'deleoshodi@gmail.com',            // activated, empty
  },
  {
    person: 'Supo Orimogunje',
    keep: 'supo30@hotmail.com',              // activated, specialty and bio
    hide: 'babaprimo@hotmail.com',           // never activated, empty
  },
];

async function load(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true, name: true, email: true, password: true,
      doctorProfile: { select: { id: true, specialtyId: true, bio: true } },
    },
  });
}

async function main() {
  console.log(`\n=== duplicate member listings ===`);
  console.log(`mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN (no writes)'}\n`);

  const actions = [];

  for (const pair of PAIRS) {
    const keep = await load(pair.keep);
    const hide = await load(pair.hide);

    if (!keep || !hide) {
      console.log(`[skip] ${pair.person}: ${!keep ? pair.keep : pair.hide} not found`);
      continue;
    }

    // Never hide the account that holds more. If the thinner one is actually
    // richer, the pair was decided wrongly and a human should look again.
    const score = (u) => (u.doctorProfile?.specialtyId ? 2 : 0) + (u.doctorProfile?.bio ? 1 : 0);
    if (score(hide) > score(keep)) {
      console.log(`[REFUSING] ${pair.person}: ${pair.hide} holds more than ${pair.keep}. Review by hand.`);
      continue;
    }

    console.log(`${pair.person}`);
    console.log(`   keep : ${keep.email}  (specialty:${keep.doctorProfile?.specialtyId ? 'yes' : 'no'}, bio:${keep.doctorProfile?.bio ? 'yes' : 'no'})`);
    console.log(`   hide : ${hide.email}  (${hide.doctorProfile ? 'listed' : 'already unlisted'})`);

    if (hide.doctorProfile) {
      actions.push({ person: pair.person, email: hide.email, profileId: hide.doctorProfile.id });
    }
  }

  const audit = `${os.tmpdir()}/dfc-dedupe-${Date.now()}.json`;
  fs.writeFileSync(audit, JSON.stringify(actions, null, 2));
  console.log(`\nlistings to remove: ${actions.length}`);
  console.log(`audit: ${audit}`);

  if (!COMMIT) {
    console.log('\nNo changes written. Re-run with --commit.');
    return;
  }

  let done = 0;
  for (const a of actions) {
    try {
      await prisma.doctorProfile.delete({ where: { id: a.profileId } });
      done++;
      console.log(`   removed listing: ${a.email}`);
    } catch (e) {
      console.log(`   [FAILED] ${a.email}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`\nremoved ${done} / ${actions.length}`);
  console.log(`doctor profiles now: ${await prisma.doctorProfile.count()}`);
}

main()
  .catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); })
  .finally(() => prisma.$disconnect());
