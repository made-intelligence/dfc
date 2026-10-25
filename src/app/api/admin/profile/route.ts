import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { validateFields, MAX_LENGTHS } from "@/lib/validation";
import { auditAdmin } from "@/lib/audit";

/**
 * PATCH /api/admin/profile — the signed-in admin edits their own name and
 * phone. Email, role and permissions are changed by another admin from
 * Manage Admins, not here.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const fieldError = validateFields(body, {
      name: { required: true, maxLength: MAX_LENGTHS.shortText },
      phone: { maxLength: MAX_LENGTHS.phone },
    });
    if (fieldError) return fieldError;

    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: { name, phone: body.phone ? String(body.phone).trim() : null },
      select: { id: true, name: true, email: true, phone: true },
    });

    auditAdmin.userUpdate(auth.userId, auth.userId, { name: user.name, phone: user.phone, self: true }, request);

    return NextResponse.json({ message: "Profile updated.", user });
  } catch (error) {
    logger.error("AdminProfileUpdate", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
