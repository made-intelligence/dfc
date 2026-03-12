import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';

async function requireAdmin(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) return null;
  const payload = await verifyToken(token) as JWTPayload;
  if (!payload || !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) return null;
  return payload;
}

// GET — list all cases with filters
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const tier = searchParams.get('tier');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Prisma.SecondOpinionCaseWhereInput = {};
  if (status) where.status = status as Prisma.EnumSecondOpinionStatusFilter;
  if (tier) where.tier = tier as Prisma.EnumSecondOpinionTierFilter;
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { patientName: { contains: search, mode: 'insensitive' } },
      { contactEmail: { contains: search, mode: 'insensitive' } },
      { specialty: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [cases, total] = await Promise.all([
    prisma.secondOpinionCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        specialist: {
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { name: true } },
            specialty: { select: { name: true } },
          },
        },
      },
    }),
    prisma.secondOpinionCase.count({ where }),
  ]);

  // Summary counts
  const counts = await prisma.secondOpinionCase.groupBy({
    by: ['status'],
    _count: true,
  });

  return NextResponse.json({
    success: true,
    cases,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
  });
}
