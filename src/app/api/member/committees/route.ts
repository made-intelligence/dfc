import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.committeeMember.findMany({
      where: { userId: payload.userId, isActive: true },
      include: {
        committee: {
          select: { id: true, name: true, shortCode: true, description: true },
        },
      },
      orderBy: { committee: { name: 'asc' } },
    });

    return NextResponse.json({ data: memberships });
  } catch (error) {
    logger.error('MemberCommittees', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
