import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { revokeAllUserTokens } from "@/lib/refresh-token";
import { logger } from "@/lib/logger";
import { validateFields, MAX_LENGTHS } from "@/lib/validation";
import { auditAdmin } from "@/lib/audit";
import { appUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/service";
import ClaimInvite from "@/emails/ClaimInvite";
import React from "react";
import {
  generateClaimToken,
  claimTokenExpiry,
  buildClaimUrl,
  CLAIM_TOKEN_TTL_DAYS,
} from "@/lib/claim-token";

const ADMIN_ROLES: UserRole[] = [UserRole.SECRETARIAT, UserRole.SUPERADMIN];

const adminSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  password: true,
  adminProfile: {
    select: {
      id: true,
      permissions: { select: { permission: { select: { id: true, name: true } } } },
    },
  },
} as const;

/**
 * Who may act on whom. Managing admins needs manage_admins (super admins have
 * everything), and only a super admin may touch another super admin or create
 * one, so a secretariat account with manage_admins can't lock out its seniors.
 */
async function authorise(request: NextRequest, targetId: string) {
  const auth = await requireAdminAuth(request);
  if (isAuthError(auth)) return { error: auth };
  const forbidden = await requirePermission(auth, "manage_admins");
  if (forbidden) return { error: forbidden };
  const actor = { id: auth.userId, role: auth.role };

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: adminSelect });
  if (!target || !ADMIN_ROLES.includes(target.role)) {
    return { error: NextResponse.json({ error: "Admin not found" }, { status: 404 }) };
  }
  if (target.role === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) {
    return {
      error: NextResponse.json(
        { error: "Only a super admin can change another super admin" },
        { status: 403 },
      ),
    };
  }

  return { actor, target };
}

function toResponse(target: NonNullable<Awaited<ReturnType<typeof findAdmin>>>) {
  const { password, adminProfile, ...rest } = target;
  return {
    ...rest,
    // Created by an admin and never activated: the invite can be re-sent.
    pendingActivation: !password,
    permissions: adminProfile?.permissions.map((p) => p.permission) ?? [],
  };
}

function findAdmin(id: string) {
  return prisma.user.findUnique({ where: { id }, select: adminSelect });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await authorise(request, id);
    if (result.error) return result.error;

    return NextResponse.json({ admin: toResponse(result.target) });
  } catch (error) {
    logger.error("AdminAdminDetail", error);
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/admins/:id
 *
 * Either `{ action: "deactivate" | "reactivate" | "resend_invite" }`, or an
 * edit of any of `{ name, phone, role, permissionIds }`.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await authorise(request, id);
    if (result.error) return result.error;
    const { actor, target } = result;
    const isSelf = actor.id === target.id;

    const body = await request.json();

    if (body.action === "deactivate") {
      if (isSelf) {
        return NextResponse.json({ error: "You can't deactivate your own account" }, { status: 400 });
      }
      await prisma.user.update({ where: { id: target.id }, data: { isActive: false } });
      // Sign them out everywhere: no refresh, so they're gone when the access token lapses.
      await revokeAllUserTokens(target.id);
      auditAdmin.userSuspend(actor.id, target.id, request);
      return NextResponse.json({ message: `${target.name} has been deactivated.` });
    }

    if (body.action === "reactivate") {
      await prisma.user.update({ where: { id: target.id }, data: { isActive: true } });
      auditAdmin.userUpdate(actor.id, target.id, { isActive: true }, request);
      return NextResponse.json({ message: `${target.name} has been reactivated.` });
    }

    if (body.action === "resend_invite") {
      if (target.password) {
        return NextResponse.json(
          { error: "This admin has already activated their account" },
          { status: 400 },
        );
      }
      const claimToken = generateClaimToken();
      await prisma.user.update({
        where: { id: target.id },
        data: { claimToken, claimTokenExpiresAt: claimTokenExpiry() },
      });
      const baseUrl = process.env.CLAIM_BASE_URL || appUrl();
      const sent = await sendEmail({
        to: target.email,
        subject: "Activate your DFC account",
        templateName: "ClaimInvite",
        component: React.createElement(ClaimInvite, {
          name: target.name || "DFC Team",
          claimLink: buildClaimUrl(baseUrl, claimToken),
          expiryDays: CLAIM_TOKEN_TTL_DAYS,
        }),
        metadata: { reason: "admin-resend", userId: target.id, role: target.role },
      });
      auditAdmin.userUpdate(actor.id, target.id, { inviteResent: true }, request);
      if (!sent.success) {
        return NextResponse.json({ error: "The activation email could not be sent" }, { status: 502 });
      }
      return NextResponse.json({ message: `A new activation link has been emailed to ${target.email}.` });
    }

    if (body.action !== undefined) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const fieldError = validateFields(body, {
      name: { maxLength: MAX_LENGTHS.shortText },
      phone: { maxLength: MAX_LENGTHS.phone },
      role: { maxLength: MAX_LENGTHS.shortText },
    });
    if (fieldError) return fieldError;

    const { name, phone, role, permissionIds } = body;

    if (role !== undefined && !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (role === UserRole.SUPERADMIN && actor.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ error: "Only a super admin can grant super admin" }, { status: 403 });
    }
    // Editing your own access is how people lock themselves out; ask a colleague.
    if (isSelf && (role !== undefined || permissionIds !== undefined)) {
      return NextResponse.json({ error: "You can't change your own role or permissions" }, { status: 400 });
    }
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    }

    let validPermissionIds: string[] | undefined;
    if (permissionIds !== undefined) {
      if (!Array.isArray(permissionIds) || permissionIds.some((p) => typeof p !== "string")) {
        return NextResponse.json({ error: "permissionIds must be a list" }, { status: 400 });
      }
      const found = await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
        select: { id: true },
      });
      validPermissionIds = found.map((p) => p.id);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(phone !== undefined && { phone: phone || null }),
          ...(role !== undefined && { role }),
        },
      });

      if (validPermissionIds) {
        const profile = target.adminProfile
          ?? (await tx.adminProfile.create({ data: { userId: target.id }, select: { id: true } }));
        await tx.adminPermission.deleteMany({ where: { adminProfileId: profile.id } });
        await tx.adminPermission.createMany({
          data: validPermissionIds.map((permissionId) => ({ adminProfileId: profile.id, permissionId })),
        });
      }
    });

    if (role !== undefined || validPermissionIds) {
      auditAdmin.permissionChange(actor.id, target.id, {
        ...(role !== undefined && { fromRole: target.role, toRole: role }),
        ...(validPermissionIds && { permissionIds: validPermissionIds }),
      }, request);
    }
    if (name !== undefined || phone !== undefined) {
      auditAdmin.userUpdate(actor.id, target.id, { name, phone }, request);
    }

    const updated = await findAdmin(target.id);
    return NextResponse.json({ message: "Admin updated.", admin: updated && toResponse(updated) });
  } catch (error) {
    logger.error("AdminAdminUpdate", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}
