import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Prisma.MedicalCredentialWhereInput = {};
    if (status) where.status = status as Prisma.EnumVerificationStatusFilter;
    if (type) where.type = type;

    const credentials = await prisma.medicalCredential.findMany({
      where,
      include: {
        dfcMember: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    logger.error('AdminCredentials', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
