import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { startBookingAccount, TemporaryPasswordError } from '@/lib/temporary-password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST — booking step for someone not signed in. An existing account is
 * asked for its password; a new email gets an account and an emailed one.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, name, phone } = await request.json();

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 255) {
      return NextResponse.json({ error: 'Enter your full name' }, { status: 400 });
    }

    const result = await startBookingAccount({
      email,
      name,
      phone: typeof phone === 'string' ? phone.slice(0, 20) : undefined,
    }, request);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TemporaryPasswordError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('BookingStart', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
