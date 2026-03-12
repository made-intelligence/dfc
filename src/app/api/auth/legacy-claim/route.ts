import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, createAuthCookie, JWTPayload } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const { token: claimToken, email, password, name } = await request.json();

    if (!claimToken || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      );
    }

    const legacy = await prisma.legacyMember.findUnique({
      where: { claimToken },
    });

    if (!legacy) {
      return NextResponse.json({ error: 'Invalid claim token' }, { status: 404 });
    }

    if (legacy.status === 'CLAIMED') {
      return NextResponse.json({ error: 'This token has already been claimed' }, { status: 409 });
    }

    if (legacy.expiresAt && new Date() > legacy.expiresAt) {
      await prisma.legacyMember.update({
        where: { id: legacy.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'This claim link has expired' }, { status: 410 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const memberName = name || legacy.name || 'DFC Member';

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: memberName,
          phone: legacy.phone,
          role: UserRole.DFC_MEMBER,
        },
      });

      await tx.patientProfile.create({ data: { userId: user.id } });

      await tx.dFCMember.create({
        data: {
          userId: user.id,
          category: 'LEGACY_MEMBER',
          status: 'ACTIVE',
          goodStanding: true,
          isLegacy: true,
          path: 'legacy',
          whatsappOptIn: true,
          effectiveDate: new Date(),
        },
      });

      await tx.legacyMember.update({
        where: { id: legacy.id },
        data: {
          status: 'CLAIMED',
          claimedByUserId: user.id,
          claimedAt: new Date(),
        },
      });

      return user;
    });

    const tokenPayload: JWTPayload = {
      userId: result.id,
      email: result.email,
      role: result.role,
      name: result.name,
    };
    const jwtToken = await createToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        user: { id: result.id, name: result.name, email: result.email },
        message: 'Welcome to DFC. Your founding membership has been activated.',
      },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', createAuthCookie(jwtToken));
    return response;
  } catch (error) {
    logger.error('LegacyClaim', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
