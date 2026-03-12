import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source: DFC_standing_committees.xlsx — approved by ExCo
const COMMITTEES = [
  {
    name: 'Governance, Elections & Constitutional Compliance',
    shortCode: 'GECC',
    description: 'Oversees constitutional compliance, elections, and governance processes.',
    members: [
      { name: 'Rotimi Jaiyesimi', role: 'CHAIR' },
    ],
  },
  {
    name: 'Finance, Fundraising & Partnerships',
    shortCode: 'FFP',
    description: 'Manages DFC finances, fundraising strategy, and institutional partnerships.',
    members: [
      { name: 'Angela Asom', role: 'CHAIR' },
    ],
  },
  {
    name: 'Membership & Engagement',
    shortCode: 'ME',
    description: 'Oversees member recruitment, retention, and engagement programmes.',
    members: [
      { name: 'Jite Erhahaghen', role: 'CHAIR' },
    ],
  },
  {
    name: 'Communications, Impact & Advocacy',
    shortCode: 'CIA',
    description: 'Manages DFC communications, advocacy strategy, and impact reporting.',
    members: [
      // No chair listed in source document — seeded as MEMBER pending ExCo appointment
      { name: 'Tolu Ekong', role: 'MEMBER' },
      { name: 'Simisola Alabi', role: 'MEMBER' },
    ],
  },
  {
    name: 'Professional Services',
    shortCode: 'PS',
    description: 'Oversees second opinion service, clinical standards, and specialist deployment.',
    members: [
      // Same person as Membership & Engagement chair — dual appointment is permitted
      { name: 'Jite Erhahaghen', role: 'CHAIR' },
    ],
  },
  {
    name: 'Research, Education & Innovation',
    shortCode: 'REI',
    description: 'Drives DFC research initiatives, CME programmes, and innovation projects.',
    members: [
      { name: 'Andrew Alalade', role: 'CHAIR' },
    ],
  },
];

function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function main() {
  console.log('Seeding DFC Standing Committees...\n');

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
  });

  const matchUser = (memberName: string) => {
    const normalised = normaliseName(memberName);
    return allUsers.find(u => u.name && normaliseName(u.name) === normalised) || null;
  };

  const unlinked: string[] = [];

  for (const committee of COMMITTEES) {
    console.log(`\n  ${committee.name} (${committee.shortCode})`);

    const saved = await prisma.standingCommittee.upsert({
      where: { shortCode: committee.shortCode },
      update: {
        name: committee.name,
        description: committee.description,
        isActive: true,
      },
      create: {
        name: committee.name,
        shortCode: committee.shortCode,
        description: committee.description,
        isActive: true,
      },
    });

    for (const member of committee.members) {
      const matchedUser = matchUser(member.name);

      if (matchedUser) {
        const existing = await prisma.committeeMember.findFirst({
          where: { committeeId: saved.id, userId: matchedUser.id },
        });

        if (!existing) {
          await prisma.committeeMember.create({
            data: {
              committeeId: saved.id,
              userId: matchedUser.id,
              memberName: member.name,
              role: member.role,
              isActive: true,
              isUnlinked: false,
            },
          });
          console.log(`    ${member.name} (${member.role}) -- linked to user account`);
        } else if (existing.role !== member.role) {
          await prisma.committeeMember.update({
            where: { id: existing.id },
            data: { role: member.role },
          });
          console.log(`    ${member.name} (${member.role}) -- role updated`);
        } else {
          console.log(`    ${member.name} -- already seeded, skipped`);
        }
      } else {
        const existing = await prisma.committeeMember.findFirst({
          where: { committeeId: saved.id, memberName: member.name, isUnlinked: true },
        });

        if (!existing) {
          await prisma.committeeMember.create({
            data: {
              committeeId: saved.id,
              userId: null,
              memberName: member.name,
              role: member.role,
              isActive: true,
              isUnlinked: true,
              notes: 'Seeded from DFC_standing_committees.xlsx -- awaiting user account',
            },
          });
          unlinked.push(`${member.name} -> ${committee.name}`);
          console.log(`    ${member.name} (${member.role}) -- NO USER ACCOUNT FOUND, seeded as unlinked`);
        } else {
          console.log(`    ${member.name} -- already seeded unlinked, skipped`);
        }
      }
    }
  }

  console.log('\n\n  SEED COMPLETE\n');

  const summary = await prisma.standingCommittee.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { name: 'asc' },
  });
  for (const c of summary) {
    console.log(`  ${c.shortCode}: ${c.name} -- ${c._count.members} member(s)`);
  }

  if (unlinked.length > 0) {
    console.log('\n  UNLINKED MEMBERS (no user account found):');
    unlinked.forEach(u => console.log(`    - ${u}`));
    console.log('\n  ACTION: Invite these individuals to create DFC accounts,');
    console.log('  then run: npx tsx prisma/seed-committees.ts again to link.\n');
  }

  console.log('\n  NOTE: Communications, Impact & Advocacy has no listed chair.');
  console.log('  Two members seeded (Tolu Ekong, Simisola Alabi). Appoint a chair via');
  console.log('  Admin -> Committees -> CIA -> Manage Members.\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
