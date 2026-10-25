import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createToken,
  createAuthCookie,
  validateEmail,
  AuthError,
  AUTH_ERRORS,
} from "@/lib/auth";
import { logger } from "@/lib/logger";
import { authRateLimit } from "@/lib/rate-limit";
import { auditAuth } from "@/lib/audit";
import { createRefreshToken, createRefreshCookie } from "@/lib/refresh-token";
import { redeemTemporaryPassword } from "@/lib/temporary-password";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        adminProfile: { select: { id: true } },
        doctorProfile: { select: { id: true, slug: true, consultationFee: true, specialtyId: true } },
        patientProfile: { select: { id: true, gender: true } },
      },
    });

    if (!user) {
      auditAuth.loginFailed(email, request);
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 401 },
      );
    }

    // Check if user is active
    if (!user.isActive) {
      auditAuth.loginFailed(email, request);
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 401 },
      );
    }

    // The account password, or failing that a password we emailed (a new
    // booking account's first one, or a "forgot password" replacement).
    const isValidPassword =
      (!!user.password && (await verifyPassword(password, user.password))) ||
      (await redeemTemporaryPassword(user.id, password, request));
    if (!isValidPassword) {
      auditAuth.loginFailed(email, request);
      // Accounts created by the secretariat have no password until the member
      // activates them via the claim link (or an emailed password).
      if (!user.password) {
        return NextResponse.json(
          {
            error: user.claimToken
              ? "This account has not been activated yet. Use the activation link we emailed you, or use \"Forgot Password?\" to get a password by email."
              : "No password is set on this account. Use \"Forgot Password?\" to get one by email.",
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
      phone: user.phone,
      profile:
        user.role === "SUPERADMIN"
          ? user.adminProfile
          : user.role === "SECRETARIAT"
            ? user.adminProfile
            : user.role === "DFC_MEMBER"
              ? user.doctorProfile
              : user.patientProfile,
    };

    // Issue refresh token
    const refresh = await createRefreshToken(user.id, request);

    // Audit successful login
    auditAuth.login(user.id, request);

    // Create response with auth cookie + refresh cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      token,
    });

    response.headers.set("Set-Cookie", createAuthCookie(token));
    response.headers.append("Set-Cookie", createRefreshCookie(refresh.token));

    return response;
  } catch (error) {
    logger.error('Login', error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
