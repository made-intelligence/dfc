import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import { parsePagination } from '@/lib/pagination';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const requestType = searchParams.get('requestType');
    const { page, limit, skip: paginationSkip } = parsePagination(searchParams);

    const where: Prisma.SecretariatTicketWhereInput = {};
    if (status) where.status = status as Prisma.EnumTicketStatusFilter;
    if (source) where.source = source;
    if (requestType) where.requestType = requestType;

    const [tickets, total] = await Promise.all([
      prisma.secretariatTicket.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip,
        take: limit,
      }),
      prisma.secretariatTicket.count({ where }),
    ]);

    return NextResponse.json({ success: true, tickets, total, page, limit });
  } catch (error) {
    logger.error('AdminSecretariat', error);
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

    const body = await request.json();

    const fieldError = validateFields(body, {
      requestType: { required: true, maxLength: MAX_LENGTHS.shortText },
      rawMessage: { maxLength: MAX_LENGTHS.longText },
      subject: { maxLength: MAX_LENGTHS.shortText },
      fromName: { maxLength: MAX_LENGTHS.shortText },
      fromPhone: { maxLength: MAX_LENGTHS.phone },
    });
    if (fieldError) return fieldError;

    const ticket = await prisma.secretariatTicket.create({
      data: {
        source: body.source || 'WEB',
        status: 'OPEN',
        requestType: body.requestType,
        rawMessage: body.rawMessage || body.description,
        subject: body.subject,
        fromName: body.fromName || user.name,
        fromPhone: body.fromPhone,
        userId: body.userId,
      },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error) {
    logger.error('AdminSecretariat', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
