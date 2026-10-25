import 'server-only';
import crypto from 'crypto';
import React from 'react';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email/service';
import { TemporaryPasswordEmail } from '@/emails/TemporaryPassword';
import { screenSignup, normalizeEmailForDedupe } from '@/lib/signup-guard';
import { logger } from '@/lib/logger';
import { audit, auditAccount } from '@/lib/audit';
import type { NextRequest } from 'next/server';

/**
 * Emailed passwords. A new booking account gets one instead of a sign-up
 * form, and "forgot password" sends a replacement. Signing in with it proves
 * the person reads that inbox; only then does it become the account password,
 * so requesting one never locks the current password out.
 */

const TTL_HOURS = 24;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_PER_HOUR = 5;
// No 0/O or 1/I/L, so it is easy to read off an email and type in.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export class TemporaryPasswordError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

function generatePassword(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

async function issue(user: { id: string; email: string; name: string }, kind: 'welcome' | 'reset') {
  const now = Date.now();
  const recent = await prisma.temporaryPassword.findMany({
    where: { userId: user.id, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (recent[0] && now - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new TemporaryPasswordError('A password was just sent. Please wait a minute before asking again.', 429);
  }
  if (recent.length >= MAX_PER_HOUR) {
    throw new TemporaryPasswordError('Too many passwords requested. Please try again later.', 429);
  }

  const password = generatePassword();
  // Only the newest emailed password works.
  await prisma.temporaryPassword.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.temporaryPassword.create({
    data: {
      userId: user.id,
      passwordHash: await hashPassword(password),
      expiresAt: new Date(now + TTL_HOURS * 60 * 60 * 1000),
    },
  });

  const result = await sendEmail({
    to: user.email,
    subject: kind === 'welcome' ? 'Your DFC account password' : 'Your new DFC password',
    templateName: kind === 'welcome' ? 'TemporaryPasswordWelcome' : 'TemporaryPasswordReset',
    component: React.createElement(TemporaryPasswordEmail, {
      name: user.name || 'there',
      password,
      kind,
      expiryHours: TTL_HOURS,
    }),
  });
  if (!result.success) {
    throw new TemporaryPasswordError('We could not send the email. Please try again shortly.', 502);
  }
}

/**
 * Booking step: an existing account just needs its password. A new email
 * gets a patient account and an emailed password.
 */
export async function startBookingAccount(
  input: { email: string; name: string; phone?: string; createdBy?: string },
  req?: NextRequest
) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { accountExists: true as const };

  // A new account gets a password emailed to an address the caller chose,
  // so screen out bots before creating anything or sending mail.
  const rejection = screenSignup({ email, name: input.name });
  if (rejection) {
    logger.warn?.('BookingStart', `blocked signup (${rejection.reason}): ${email}`);
    throw new TemporaryPasswordError(rejection.message);
  }
  // Gmail ignores dots and "+" tags: one inbox must not mint many accounts.
  const canonical = normalizeEmailForDedupe(email);
  if (canonical !== email && (await prisma.user.findUnique({ where: { email: canonical }, select: { id: true } }))) {
    throw new TemporaryPasswordError(
      `An account already exists for this inbox. Please continue with ${canonical}.`,
      409
    );
  }

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        role: UserRole.PATIENT,
        password: null, // set when the emailed password is first used
        provider: 'local',
        patientProfile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });
  } catch (error) {
    // Two requests for the same new email: the other one created it.
    if ((error as { code?: string }).code === 'P2002') return { accountExists: true as const };
    throw error;
  }

  await auditAccount.create(
    user.id,
    { via: input.createdBy ? 'secretariat_booking' : 'booking', email, createdBy: input.createdBy },
    req
  );
  await issue(user, 'welcome');
  return { accountExists: false as const };
}

/** Forgot password: email a new one if the account exists. */
export async function sendReplacementPassword(rawEmail: string, req?: NextRequest) {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, isActive: true },
  });
  // Logged even for unknown emails: a run of them is someone probing for accounts.
  await auditAccount.passwordResetRequest(
    user?.id ?? null,
    { email, outcome: !user ? 'unknown_email' : !user.isActive ? 'inactive_account' : 'sent' },
    req
  );
  if (!user || !user.isActive) return; // say nothing about unknown emails
  await issue(user, 'reset');
}

/**
 * Called by login when the account password doesn't match. A valid emailed
 * password becomes the account password (and settles any pending invite).
 */
export async function redeemTemporaryPassword(
  userId: string,
  password: string,
  req?: NextRequest
): Promise<boolean> {
  const candidates = await prisma.temporaryPassword.findMany({
    where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  const match = candidates[0];
  if (!match || !(await verifyPassword(password, match.passwordHash))) return false;

  await prisma.$transaction([
    prisma.temporaryPassword.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    // Signing in proves the email, so a pending member invite is settled...
    prisma.user.update({
      where: { id: userId },
      data: { password: match.passwordHash, claimToken: null, claimTokenExpiresAt: null },
    }),
    // ...and an old guest-booking account becomes an ordinary one.
    prisma.user.updateMany({
      where: { id: userId, provider: 'guest' },
      data: { provider: 'local' },
    }),
  ]);
  await audit(
    {
      userId,
      action: 'AUTH_PASSWORD_CHANGE',
      resource: 'user',
      resourceId: userId,
      details: { via: 'emailed_password' },
      severity: 'WARN',
    },
    req
  );
  return true;
}
