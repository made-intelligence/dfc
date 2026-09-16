/**
 * Remove a single stray self-registration so the person can re-apply.
 *
 * For doctors who hit "Sign up" instead of "Join DFC", ending up with an empty
 * PATIENT account that then blocks their membership application on the
 * duplicate-email check.
 *
 * Refuses to delete anything that holds real data: any appointment, case,
 * ticket, notification, member record or doctor profile, or any role other
 * than PATIENT. Prints the account and writes an audit file before deleting.
 *
 *   node scripts/remove-stray-signup.cjs --email=someone@example.com
 *   node scripts/remove-stray-signup.cjs --email=someone@example.com --commit
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const os = require('os');

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const EMAIL = (args.find((a) => a.startsWith('--email=')) || '').split('=')[1] || '';

async function main() {
  if (!EMAIL) {
    console.error('--email=<address> is required');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: EMAIL.toLowerCase().trim() },
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

  if (!user) {
    console.log(`No account found for ${EMAIL}. Nothing to do.`);
    return;
  }

  const activity = Object.entries(user._count).filter(([, n]) => n > 0);

  console.log('\n=== stray signup ===');
  console.log(`name    : ${user.name}`);
  console.log(`email   : ${user.email}`);
  console.log(`role    : ${user.role}`);
  console.log(`created : ${user.createdAt.toISOString()}`);
  console.log(`activity: ${activity.length ? activity.map(([k, n]) => `${k}=${n}`).join(', ') : 'none'}`);
  console.log(`member record: ${user.dfcMember ? 'YES' : 'no'} | doctor profile: ${user.doctorProfile ? 'YES' : 'no'}`);

  const blockers = [];
  if (user.role !== 'PATIENT') blockers.push(`role is ${user.role}, not PATIENT`);
  if (activity.length) blockers.push('account has activity');
  if (user.dfcMember) blockers.push('has a DFC member record');
  if (user.doctorProfile) blockers.push('has a doctor profile');

  if (blockers.length) {
    console.log(`\nREFUSING to delete: ${blockers.join('; ')}.`);
    process.exit(1);
  }

  const audit = `${os.tmpdir()}/dfc-stray-signup-${Date.now()}.json`;
  fs.writeFileSync(audit, JSON.stringify(user, null, 2));
  console.log(`\naudit written: ${audit}`);

  if (!COMMIT) {
    console.log('DRY-RUN. Re-run with --commit to delete.');
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted. ${user.email} can now submit the join form.`);
}

main()
  .catch((e) => { console.error('FAILED:', e.message.split('\n')[0]); process.exit(1); })
  .finally(() => prisma.$disconnect());
