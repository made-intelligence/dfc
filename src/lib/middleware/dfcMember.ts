import { prisma } from '@/lib/prisma';
import type { DFCMemberCategory, DFCMemberStatus } from '@prisma/client';

interface DFCMemberData {
  category: DFCMemberCategory;
  status: DFCMemberStatus;
  goodStanding: boolean;
  duesExpiresAt: Date | null;
}

export async function getDFCMemberStatus(userId: string): Promise<DFCMemberData | null> {
  const member = await prisma.dFCMember.findUnique({
    where: { userId },
    select: {
      category: true,
      status: true,
      goodStanding: true,
      duesExpiresAt: true,
    },
  });
  return member;
}

export function canVote(member: DFCMemberData | null): boolean {
  if (!member) return false;
  if (!member.goodStanding) return false;
  if (member.category === 'ASSOCIATE_MEMBER') return false;
  if (member.category === 'HONORARY_MEMBER') return false;
  return member.status === 'ACTIVE';
}

export function canHoldOffice(member: DFCMemberData | null): boolean {
  if (!canVote(member)) return false;
  return member?.category === 'MEMBER';
}

export function canAccessMarketplace(member: DFCMemberData | null): boolean {
  if (!member) return false;
  return member.status === 'ACTIVE';
}

export function isDuesExpired(member: DFCMemberData | null): boolean {
  if (!member || !member.duesExpiresAt) return true;
  return new Date() > member.duesExpiresAt;
}

export function isDuesSoon(member: DFCMemberData | null, daysThreshold = 30): boolean {
  if (!member || !member.duesExpiresAt) return false;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  return member.duesExpiresAt <= threshold;
}
