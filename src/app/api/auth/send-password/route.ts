import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendReplacementPassword, TemporaryPasswordError } from '@/lib/temporary-password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST — "forgot password": email a new password. The current one keeps
// working until the new one is used.
export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await request.json();
    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    await sendReplacementPassword(email, request);
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a new password is on its way.',
    });
  } catch (error) {
    if (error instanceof TemporaryPasswordError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('SendPassword', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
