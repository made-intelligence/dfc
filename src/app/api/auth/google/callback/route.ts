import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, createAuthCookie } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/';
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent('Google authentication failed')}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/login?error=No authorization code received', request.url)
      );
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(
        new URL('/auth/login?error=Google OAuth is not configured', request.url)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: googleUser.email },
          {
            provider: 'google',
            providerId: googleUser.sub,
          },
        ],
      },
      include: {
        adminProfile: true,
        doctorProfile: true,
        patientProfile: true,
      },
    });

    if (!user) {
      // Create new user with patient role by default
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          profileImage: googleUser.picture,
          provider: 'google',
          providerId: googleUser.sub,
          role: UserRole.PATIENT,
          patientProfile: {
            create: {},
          },
        },
        include: {
          adminProfile: true,
          doctorProfile: true,
          patientProfile: true,
        },
      });
    } else if (user.provider === 'local') {
      // Update existing local user to link Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          providerId: googleUser.sub,
          profileImage: googleUser.picture || user.profileImage,
        },
        include: {
          adminProfile: true,
          doctorProfile: true,
          patientProfile: true,
        },
      });
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Redirect to appropriate page
    const response = NextResponse.redirect(new URL(state, request.url));
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication failed', request.url)
    );
  }
}

