import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { sendClaimLink, normalisePhone } from '@/lib/whatsapp/service';
import { UserRole } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { logger } from '@/lib/logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== UserRole.SECRETARIAT && user.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [members, stats] = await Promise.all([
      prisma.legacyMember.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.legacyMember.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const statusCounts = stats.reduce(
      (acc, s) => ({ ...acc, [s.status]: s._count }),
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      members,
      stats: {
        total: members.length,
        ...statusCounts,
      },
    });
  } catch (error) {
    logger.error('AdminLegacyMigration', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || (user.role !== UserRole.SECRETARIAT && user.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, members: memberList, memberId } = await request.json();

    if (action === 'import') {
      // Bulk import from array of { name, phone }
      if (!Array.isArray(memberList) || memberList.length === 0) {
        return NextResponse.json({ error: 'Members array is required' }, { status: 400 });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const created = await Promise.all(
        memberList.map(async (m: { name: string; phone: string; email?: string }) => {
          const phone = normalisePhone(m.phone);
          const existing = await prisma.legacyMember.findFirst({ where: { phone } });
          if (existing) return null;

          return prisma.legacyMember.create({
            data: {
              name: m.name || null,
              phone,
              email: m.email || null,
              claimToken: uuid(),
              status: 'IMPORTED',
              expiresAt,
            },
          });
        })
      );

      const imported = created.filter(Boolean).length;
      return NextResponse.json({ success: true, imported, skipped: memberList.length - imported });
    }

    if (action === 'send') {
      // Send claim link to a specific member
      if (!memberId) {
        return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
      }

      const member = await prisma.legacyMember.findUnique({ where: { id: memberId } });
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      const claimUrl = `${APP_URL}/auth/claim?token=${member.claimToken}`;
      const result = await sendClaimLink(member.phone, member.name || 'DFC Member', claimUrl);

      await prisma.legacyMember.update({
        where: { id: memberId },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : undefined,
        },
      });

      return NextResponse.json({ success: result.success, error: result.error });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('AdminLegacyMigration', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
