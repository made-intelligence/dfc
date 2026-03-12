import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) return null;
  return payload;
}

// GET — list all committees with members
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const committees = await prisma.standingCommittee.findMany({
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
          },
          orderBy: [{ role: 'asc' }, { memberName: 'asc' }],
        },
        _count: { select: { members: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: committees });
  } catch (error) {
    logger.error('AdminCommittees', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — add a member to a committee
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { committeeId, userId, memberName, role } = body;

    if (!committeeId || !memberName || !role) {
      return NextResponse.json({ error: 'committeeId, memberName, and role are required' }, { status: 400 });
    }

    const validRoles = ['CHAIR', 'DEPUTY_CHAIR', 'SECRETARY', 'MEMBER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
    }

    const committee = await prisma.standingCommittee.findUnique({ where: { id: committeeId } });
    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    // Check for duplicate if userId provided
    if (userId) {
      const existing = await prisma.committeeMember.findFirst({
        where: { committeeId, userId, isActive: true },
      });
      if (existing) {
        return NextResponse.json({ error: 'User is already an active member of this committee' }, { status: 409 });
      }
    }

    const member = await prisma.committeeMember.create({
      data: {
        committeeId,
        userId: userId || null,
        memberName,
        role,
        isActive: true,
        isUnlinked: !userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        committee: { select: { name: true, shortCode: true } },
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    logger.error('AdminCommittees:POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — update member role or deactivate
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { memberId, role, isActive } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    const existing = await prisma.committeeMember.findUnique({ where: { id: memberId } });
    if (!existing) {
      return NextResponse.json({ error: 'Committee member not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (role !== undefined) {
      const validRoles = ['CHAIR', 'DEPUTY_CHAIR', 'SECRETARY', 'MEMBER'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 });
      }
      updateData.role = role;
    }

    if (isActive === false) {
      updateData.isActive = false;
      updateData.endedAt = new Date();
    }

    const updated = await prisma.committeeMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        committee: { select: { name: true, shortCode: true } },
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    logger.error('AdminCommittees:PATCH', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
