import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthResult> {
  const token = getTokenFromCookies(request.headers.get('cookie'));
  if (!token) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { user: null, error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    return { user: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { user: null, error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  return { user, error: null };
}
