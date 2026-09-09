import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/service";
import ClaimInvite from "@/emails/ClaimInvite";
import React from "react";
import { logger } from "@/lib/logger";
import {
  generateClaimToken,
  claimTokenExpiry,
  buildClaimUrl,
  CLAIM_TOKEN_TTL_DAYS,
} from "@/lib/claim-token";

/**
 * POST /api/auth/resend-claim — self-service replacement for an expired
 * activation link.
 *
 * Claim links expire after 30 days, and the only recovery was emailing the
 * secretariat, who then had to run a script. This lets a member re-issue their
 * own link.
 *
 * Always responds the same way whether or not the address is on file: the
 * response must not reveal who holds an account.
 */

const GENERIC_RESPONSE = {
  message:
    "If that address belongs to an account awaiting activation, a new link is on its way. Please check your inbox and spam folder.",
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true, claimToken: true },
    });

    // Only accounts that were created for a member and never activated get a
    // new link. An account with a password already set must use sign-in or
    // password reset, and we say nothing either way.
    const eligible = user && !user.password && user.claimToken !== null;

    if (eligible) {
      const token = generateClaimToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { claimToken: token, claimTokenExpiresAt: claimTokenExpiry() },
      });

      const baseUrl =
        process.env.CLAIM_BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://www.dfcare.org";

      await sendEmail({
        to: user.email,
        subject: "Your new DFC activation link",
        templateName: "ClaimInvite",
        component: React.createElement(ClaimInvite, {
          name: user.name || "DFC Member",
          claimLink: buildClaimUrl(baseUrl, token),
          expiryDays: CLAIM_TOKEN_TTL_DAYS,
        }),
        metadata: { reason: "self-service-resend", userId: user.id },
      });
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    logger.error("ResendClaim", error);
    // Still generic: a failure here must not become an account oracle.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
