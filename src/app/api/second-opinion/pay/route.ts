import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Initialize Paystack payment for a second opinion case
export async function POST(request: NextRequest) {
  try {
    // Auth is optional — anonymous users can pay for their submitted cases
    const token = getTokenFromCookies(request.headers.get('cookie'));
    const payload = token ? await verifyToken(token) : null;

    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const soCase = await prisma.secondOpinionCase.findUnique({
      where: { id: caseId },
    });

    if (!soCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // If user is logged in, verify ownership (unless admin)
    if (payload && soCase.userId && soCase.userId !== payload.userId) {
      const isAdmin = ['SUPERADMIN', 'SECRETARIAT'].includes(payload.role);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Case does not belong to authenticated user' }, { status: 403 });
      }
    }

    if (soCase.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Payment already processed or case is not in a payable state' },
        { status: 400 }
      );
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!paystackSecret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const reference = `SO-${soCase.reference}-${Date.now()}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/second-opinion/callback`;

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: soCase.contactEmail,
        amount: soCase.amountKobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          caseId: soCase.id,
          caseReference: soCase.reference,
          tier: soCase.tier,
          paymentType: 'SECOND_OPINION',
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      logger.error('SecondOpinionPay', 'Paystack init error', data);
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }

    // Store payment reference on the case
    await prisma.secondOpinionCase.update({
      where: { id: caseId },
      data: { paymentReference: reference },
    });

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference,
    });
  } catch (error) {
    logger.error('SecondOpinionPay', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
