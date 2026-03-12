import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'DOCUMENT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const where: Record<string, unknown> = { patientId };
    if (type) where.type = type;

    const documents = await prisma.clinicalDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    logger.error('EMR:DocumentsList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const {
      patientId, encounterId, type, title, description,
      fileUrl, fileType, fileSizeKb, isPatientVisible,
    } = body;

    if (!patientId || !type || !title || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: 'patientId, type, title, fileUrl, and fileType are required' },
        { status: 400 },
      );
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'CREATED', 'DOCUMENT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const document = await prisma.clinicalDocument.create({
      data: {
        patientId,
        encounterId,
        uploadedById: payload.userId,
        type,
        title,
        description,
        fileUrl,
        fileType,
        fileSizeKb,
        isPatientVisible: isPatientVisible !== undefined ? isPatientVisible : true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    logger.error('EMR:DocumentCreate', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
