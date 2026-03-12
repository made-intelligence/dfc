import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword, createToken, createAuthCookie, JWTPayload } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Find the guest user (provider = 'guest', no password set)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.password) {
      return NextResponse.json(
        { error: 'This account already has a password. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Set password and upgrade from guest to full account
    const hashedPassword = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        provider: 'local',
      },
    });

    // Issue JWT and set cookie
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
      message: 'Account activated. You can now sign in and manage your appointments.',
    });
    response.headers.set('Set-Cookie', createAuthCookie(jwtToken));
    return response;
  } catch (error) {
    logger.error('ClaimAccount', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
