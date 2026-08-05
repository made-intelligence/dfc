import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  validatePassword,
  createToken,
  createAuthCookie,
  JWTPayload,
} from '@/lib/auth';
import { logger } from '@/lib/logger';
import { authRateLimit } from '@/lib/rate-limit';

/**
 * Account-claim flow for admin-created members.
 *
 * GET  /api/auth/claim?token=...  -> validate a claim token, return the
 *   member's name/email so the page can greet them (no password yet).
 * POST /api/auth/claim            -> { token, password } sets the member's
 *   password, clears the claim token, and signs them in.
 *
 * Backed by the User.claimToken column (see src/lib/claim-token.ts).
 */

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing claim token' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { claimToken: token },
    select: {
      name: true,
      email: true,
      password: true,
      claimTokenExpiresAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'This claim link is invalid or has already been used.' },
      { status: 404 },
    );
  }

  if (user.password) {
    return NextResponse.json(
      { error: 'This account has already been activated. Please sign in.' },
      { status: 409 },
    );
  }

  if (user.claimTokenExpiresAt && new Date() > user.claimTokenExpiresAt) {
    return NextResponse.json(
      { error: 'This claim link has expired. Please contact the DFC secretariat.' },
      { status: 410 },
    );
  }

  return NextResponse.json({ name: user.name, email: user.email });
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 },
      );
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { claimToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'This claim link is invalid or has already been used.' },
        { status: 404 },
      );
    }

    if (user.password) {
      return NextResponse.json(
        { error: 'This account has already been activated. Please sign in.' },
        { status: 409 },
      );
    }

    if (user.claimTokenExpiresAt && new Date() > user.claimTokenExpiresAt) {
      return NextResponse.json(
        { error: 'This claim link has expired. Please contact the DFC secretariat.' },
        { status: 410 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        provider: 'local',
        claimToken: null,
        claimTokenExpiresAt: null,
      },
    });

    const tokenPayload: JWTPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    };
    const jwtToken = await createToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      message: 'Welcome to DFC. Your account is now active.',
    });
    response.headers.set('Set-Cookie', createAuthCookie(jwtToken));
    return response;
  } catch (error) {
    logger.error('Claim', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
