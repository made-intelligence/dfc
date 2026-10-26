import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminAuth,
  isAuthError,
  verifyPassword,
  hashPassword,
  validatePassword,
} from "@/lib/auth";
import { logger } from "@/lib/logger";
import { authRateLimit } from "@/lib/rate-limit";
import { auditAuth } from "@/lib/audit";
import {
  revokeAllUserTokens,
  createRefreshToken,
  createRefreshCookie,
} from "@/lib/refresh-token";

/**
 * POST /api/admin/profile/password — the signed-in admin changes their own
 * password. Every other session is signed out; this one gets a fresh refresh
 * token so the person making the change stays signed in.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await authRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { currentPassword, newPassword } = await request.json();

    if (typeof newPassword !== "string" || !newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }
    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, password: true },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // An account signed in with Google, or on an emailed one-time password,
    // has no stored password to confirm against.
    if (user.password) {
      if (typeof currentPassword !== "string" || !(await verifyPassword(currentPassword, user.password))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if (await verifyPassword(newPassword, user.password)) {
        return NextResponse.json(
          { error: "New password must be different from the current one" },
          { status: 400 },
        );
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    await revokeAllUserTokens(user.id);
    const refresh = await createRefreshToken(user.id, request);

    auditAuth.passwordChange(user.id, request);

    const response = NextResponse.json({ message: "Password changed. Other sessions have been signed out." });
    response.headers.set("Set-Cookie", createRefreshCookie(refresh.token));
    return response;
  } catch (error) {
    logger.error("AdminPasswordChange", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
