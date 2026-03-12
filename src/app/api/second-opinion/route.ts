import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summariseCaseForSpecialist } from '@/lib/ai/service';
import { verifyToken, getTokenFromCookies, JWTPayload } from '@/lib/auth';
import { SecondOpinionTier } from '@prisma/client';
import { logger } from '@/lib/logger';
import { validateFields, MAX_LENGTHS } from '@/lib/validation';

const TIER_PRICES: Record<string, number> = {
  STANDARD: 8500000,  // ₦85,000 in kobo
  COMPLEX: 15000000,  // ₦150,000 in kobo
  ONCOLOGY: 18000000, // ₦180,000 in kobo
};

import crypto from 'crypto';

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `DFC-SO-${code}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      patientName,
      patientDob,
      contactEmail,
      specialty,
      diagnosis,
      proposedTreatment,
      specificQuestions,
      tier,
      requesterType,
      contactPhone,
      documents,
    } = body;

    const fieldError = validateFields(body, {
      patientName: { required: true, maxLength: MAX_LENGTHS.shortText },
      contactEmail: { required: true, maxLength: MAX_LENGTHS.email },
      specialty: { required: true, maxLength: MAX_LENGTHS.shortText },
      diagnosis: { required: true, maxLength: MAX_LENGTHS.longText },
      proposedTreatment: { maxLength: MAX_LENGTHS.longText },
      specificQuestions: { maxLength: MAX_LENGTHS.longText },
      contactPhone: { maxLength: MAX_LENGTHS.phone },
    });
    if (fieldError) return fieldError;

    const validTier = tier && TIER_PRICES[tier] ? tier : 'STANDARD';
    const amountKobo = TIER_PRICES[validTier];

    // Check if user is logged in
    let userId: string | null = null;
    try {
      const token = getTokenFromCookies(request.headers.get('cookie'));
      if (token) {
        const payload = await verifyToken(token) as JWTPayload;
        if (payload?.userId) userId = payload.userId;
      }
    } catch {
      // Anonymous submission — that's fine
    }

    // Generate unique reference
    let reference = generateReference();
    let attempts = 0;
    while (await prisma.secondOpinionCase.findUnique({ where: { reference } })) {
      reference = generateReference();
      if (++attempts > 20) {
        return NextResponse.json({ error: 'Unable to generate unique reference. Please try again.' }, { status: 500 });
      }
    }

    const soCase = await prisma.secondOpinionCase.create({
      data: {
        reference,
        patientName,
        patientDob: patientDob ? new Date(patientDob) : null,
        contactEmail,
        contactPhone: contactPhone || null,
        requesterType: requesterType || 'patient',
        userId,
        specialty,
        diagnosis,
        proposedTreatment: proposedTreatment || null,
        specificQuestions: specificQuestions || null,
        documents: documents || null,
        tier: validTier as SecondOpinionTier,
        amountKobo,
        status: 'SUBMITTED',
      },
    });

    // Fire-and-forget: generate AI brief
    (async () => {
      try {
        const brief = await summariseCaseForSpecialist({
          patientName,
          dob: patientDob,
          diagnosis,
          proposedTreatment,
          specificQuestions,
          specialty,
        });
        await prisma.secondOpinionCase.update({
          where: { id: soCase.id },
          data: { aiBrief: brief },
        });
      } catch (err) {
        logger.error('SecondOpinionAIBrief', err, { caseId: soCase.id });
      }
    })();

    return NextResponse.json({
      success: true,
      referenceNumber: reference,
      caseId: soCase.id,
      amountKobo,
      tier: validTier,
    });
  } catch (error) {
    logger.error('SecondOpinion', error);
    return NextResponse.json(
      { error: 'Failed to submit second opinion request.' },
      { status: 500 }
    );
  }
}

// GET — fetch case by reference (for patient tracking) or list (for admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('reference');

  if (ref) {
    const soCase = await prisma.secondOpinionCase.findUnique({
      where: { reference: ref },
      select: {
        id: true,
        reference: true,
        status: true,
        tier: true,
        specialty: true,
        createdAt: true,
        paidAt: true,
        assignedAt: true,
        reportDeliveredAt: true,
        patientName: true,
      },
    });
    if (!soCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, case: soCase });
  }

  return NextResponse.json({ error: 'Reference parameter required' }, { status: 400 });
}
