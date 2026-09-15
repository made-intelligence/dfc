/**
 * Remove automated signups from the user table.
 *
 * Targets only PATIENT accounts whose name is machine-generated (a single run
 * of letters with repeated mid-word case flips) or whose address is a carrier
 * SMS gateway. Uses the same test as src/lib/signup-guard.ts, which was
 * validated against all existing users with no real name flagged.
 *
 * Refuses to touch any account with real activity (appointments, cases,
 * second opinions, a member record, or any role other than PATIENT), and
 * writes every row to an audit file before deleting.
 *
 * SAFETY: dry-run by default.
 *   node scripts/purge-bot-signups.cjs                 # preview
 *   node scripts/purge-bot-signups.cjs --commit        # delete
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();
const COMMIT = process.argv.includes('--commit');

const SMS_GATEWAYS = new Set([
  'vtext.com', 'txt.att.net', 'mms.att.net', 'tmomail.net',
  'messaging.sprintpcs.com', 'pm.sprint.com', 'vzwpix.com',
  'msg.fi.google.com', 'email.uscc.net', 'mymetropcs.com',
  'sms.cricketwireless.net',
]);

function looksMachineGenerated(name) {
  const t = (name || '').trim();
  if (/\s/.test(t)) return false;
  if (t.length < 12) return false;
  if (!/^[A-Za-z]+$/.test(t)) return false;
  let flips = 0;
  for (let i = 1; i < t.length; i++) {
    if ((t[i - 1] === t[i - 1].toUpperCase()) !== (t[i] === t[i].toUpperCase())) flips++;
  }
  return flips >= 5;
}

function isSmsGateway(email) {
  return SMS_GATEWAYS.has((email || '').toLowerCase().split('@')[1] || '');
}

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: {
        select: {
          createdAppointments: true,
          doctorAppointments: true,
          secondOpinionCases: true,
          secretariatTickets: true,
          committeeMembers: true,
          betaFeedback: true,
          notifications: true,
        },
      },
      dfcMember: { select: { id: true } },
      doctorProfile: { select: { id: true } },
    },
  });

  const candidates = users.filter(
    (u) => looksMachineGenerated(u.name) || isSmsGateway(u.email),
  );

  const keep = [];
  const remove = [];
  for (const u of candidates) {
    const counts = u._count || {};
    const activity = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    if (activity > 0 || u.dfcMember || u.doctorProfile) {
      keep.push({ ...u, why: u.dfcMember ? 'member record' : u.doctorProfile ? 'doctor profile' : 'has activity' });
    }
    else remove.push(u);
  }

  console.log(`\n=== bot signup purge ===`);
  console.log(`mode: ${COMMIT ? 'COMMIT (deleting)' : 'DRY-RUN (no writes)'}`);
  console.log(`PATIENT accounts scanned : ${users.length}`);
  console.log(`matched as automated     : ${candidates.length}`);
  console.log(`skipped (real activity)  : ${keep.length}`);
  console.log(`to delete                : ${remove.length}\n`);

  keep.forEach((u) => console.log(`  [skip] ${u.name} <${u.email}> (${u.why})`));

  const audit = `${os.tmpdir()}/dfc-bot-purge-${Date.now()}.json`;
  fs.writeFileSync(audit, JSON.stringify(remove, null, 2));
  console.log(`audit written: ${audit}`);

  if (!COMMIT) {
    remove.slice(0, 10).forEach((u) => console.log(`  [would delete] ${u.name} <${u.email}>`));
    if (remove.length > 10) console.log(`  ... and ${remove.length - 10} more`);
    console.log('\nNo changes written. Re-run with --commit to delete.');
    return;
  }

  let deleted = 0;
  for (const u of remove) {
    try {
      await prisma.user.delete({ where: { id: u.id } });
      deleted++;
    } catch (e) {
      console.log(`  [FAILED] ${u.email}: ${e.message.split('\n')[0]}`);
    }
  }
  console.log(`\ndeleted: ${deleted} / ${remove.length}`);
  console.log(`remaining users: ${await prisma.user.count()}`);
}

main()
  .catch((e) => { console.error('FAILED:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
