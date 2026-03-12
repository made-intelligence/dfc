import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Verify Paystack payment for second opinion
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'reference is required' }, { status: 400 });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    // Verify with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });

    const data = await res.json();

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
    }

    // Find and update case
    const soCase = await prisma.secondOpinionCase.findFirst({
      where: { paymentReference: reference },
    });

    if (!soCase) {
      return NextResponse.json({ error: 'Case not found for this payment' }, { status: 404 });
    }

    // IDOR: verify the authenticated user owns this case (or is admin)
    if (soCase.userId && soCase.userId !== payload.userId && !['SUPERADMIN', 'SECRETARIAT'].includes(payload.role)) {
      logger.error('SecondOpinionVerify', 'User mismatch', {
        authenticatedUser: payload.userId,
        caseUserId: soCase.userId,
      });
      return NextResponse.json({ error: 'Case does not belong to authenticated user' }, { status: 403 });
    }

    if (soCase.status === 'PAID' || soCase.status === 'ASSIGNED') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        caseReference: soCase.reference,
      });
    }

    await prisma.secondOpinionCase.update({
      where: { id: soCase.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Also create a Payment record for accounting
    await prisma.payment.create({
      data: {
        userId: soCase.userId,
        amount: soCase.amountKobo / 100, // Store in naira in Payment model
        currency: 'NGN',
        paymentReference: reference,
        provider: 'PAYSTACK',
        paymentType: 'SECOND_OPINION',
        metadata: {
          caseId: soCase.id,
          caseReference: soCase.reference,
          tier: soCase.tier,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified. Your case is now in the queue for specialist assignment.',
      caseReference: soCase.reference,
    });
  } catch (error) {
    logger.error('SecondOpinionVerify', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
