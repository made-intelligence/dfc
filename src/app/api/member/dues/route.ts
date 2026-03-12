import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

const ANNUAL_DUES_KOBO = 15000000; // ₦150,000 in kobo
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const dfcMember = await prisma.dFCMember.findUnique({
      where: { userId: payload.userId },
      select: {
        goodStanding: true,
        lastDuesPaidAt: true,
        duesExpiresAt: true,
        category: true,
        status: true,
      },
    });

    if (!dfcMember) {
      return NextResponse.json({ error: 'DFC membership not found' }, { status: 404 });
    }

    // Get payment history
    const payments = await prisma.payment.findMany({
      where: { userId: payload.userId, paymentType: 'ANNUAL_DUES' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      memberName: payload.name || null,
      inGoodStanding: dfcMember.goodStanding,
      lastPaidAt: dfcMember.lastDuesPaidAt?.toISOString() || null,
      duesExpiresAt: dfcMember.duesExpiresAt?.toISOString() || null,
      duesStatus: dfcMember.status,
      category: dfcMember.category,
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.createdAt.toISOString(),
        reference: p.paymentReference,
        status: "success",
      })),
    });
  } catch (error) {
    logger.error('MemberDues', error);
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
    const { action, reference } = body;

    if (action === 'pay') {
      // Initialize Paystack payment
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email: payload.email,
          amount: ANNUAL_DUES_KOBO,
          callback_url: `${APP_URL}/member/dues?payment=callback`,
          metadata: {
            type: 'ANNUAL_DUES',
            userId: payload.userId,
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackData.status) {
        return NextResponse.json(
          { error: paystackData.message || 'Payment initialization failed' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      });
    }

    if (action === 'verify') {
      if (!reference) {
        return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
      }

      // Check if already processed
      const existingPayment = await prisma.payment.findUnique({
        where: { paymentReference: reference },
      });
      if (existingPayment) {
        return NextResponse.json({ success: true, message: 'Payment already processed' });
      }

      // Verify with Paystack
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        }
      );
      const verifyData = await verifyRes.json();

      if (!verifyData.status || verifyData.data.status !== 'success') {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await prisma.$transaction(async (tx) => {
        // Update DFCMember
        await tx.dFCMember.update({
          where: { userId: payload.userId },
          data: {
            goodStanding: true,
            duesStatus: "PAID",
            lastDuesPaidAt: now,
            duesExpiresAt: expiresAt,
            duesPaidAmount: ANNUAL_DUES_KOBO / 100,
          },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            userId: payload.userId,
            amount: ANNUAL_DUES_KOBO / 100,
            currency: 'NGN',
            paymentReference: reference,
            provider: 'PAYSTACK',
            paymentType: 'ANNUAL_DUES',
            metadata: { type: 'ANNUAL_DUES', verifiedAt: now.toISOString() },
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: payload.userId,
            title: 'Dues payment received',
            message: `Your DFC annual dues have been received. Membership valid until ${expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            type: 'success',
            link: '/member/dues',
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Dues payment confirmed',
        duesExpiresAt: expiresAt,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('MemberDues', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
