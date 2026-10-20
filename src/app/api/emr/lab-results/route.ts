import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { checkRecordAccess } from '@/lib/emr/access';
import { logger } from '@/lib/logger';

interface ResultItem {
  test?: string;
  value?: string | number;
  unit?: string;
  refRange?: string;
  flag?: string;
}

// GET /api/emr/lab-results?patientId= — lab results, one row per measured value.
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const patientId = new URL(request.url).searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const access = await checkRecordAccess(
      payload.userId, payload.role, patientId, 'VIEWED', 'LAB_RESULT',
    );
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const results = await prisma.labResult.findMany({
      where: { patientId },
      orderBy: { reportDate: 'desc' },
    });

    // A report holds several measured values in `results`; flatten them so each
    // value is a row. Reports without itemised values show their interpretation.
    const labResults = results.flatMap((r) => {
      const items = Array.isArray(r.results) ? (r.results as ResultItem[]) : [];
      if (items.length === 0) {
        return [{
          id: r.id,
          testName: r.testName,
          result: r.interpretation || 'See report',
          isAbnormal: r.isAbnormal,
          date: r.reportDate,
          documentUrl: r.documentUrl ?? undefined,
        }];
      }
      return items.map((item, i) => ({
        id: `${r.id}-${i}`,
        testName: item.test ? `${r.testName}: ${item.test}` : r.testName,
        result: item.value !== undefined ? String(item.value) : '—',
        unit: item.unit,
        referenceRange: item.refRange,
        isAbnormal: item.flag ? !['N', 'NORMAL'].includes(item.flag.toUpperCase()) : r.isAbnormal,
        date: r.reportDate,
        documentUrl: r.documentUrl ?? undefined,
      }));
    });

    return NextResponse.json({ labResults });
  } catch (error) {
    logger.error('EMR:LabResultsList', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
