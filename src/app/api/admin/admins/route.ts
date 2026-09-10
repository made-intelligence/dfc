import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getDefaultPermissionsByRole } from "@/lib/permissions";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { parsePagination } from "@/lib/pagination";
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const { name, email, phone, role, permissionIds } = body;

    const fieldError = validateFields(body, {
      name: { required: true, maxLength: MAX_LENGTHS.shortText },
      email: { required: true, maxLength: MAX_LENGTHS.email },
      phone: { maxLength: MAX_LENGTHS.phone },
      role: { required: true, maxLength: MAX_LENGTHS.shortText },
    });
    if (fieldError) return fieldError;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Issue a claim link rather than a password. This used to hash a random
    // password and return it as `temporaryPassword`, which the admin UI never
    // read and no email ever carried, so anyone added here was left with an
    // account they could not sign in to.
    const claimToken = generateClaimToken();
    
    // Get default permissions based on role if none provided
    let defaultPermissionIds = permissionIds;
    if (!defaultPermissionIds || defaultPermissionIds.length === 0) {
      const defaultPermissions = await getDefaultPermissionsByRole(role);
      defaultPermissionIds = defaultPermissions.map(p => p.id);
    }

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: null,
        claimToken,
        claimTokenExpiresAt: claimTokenExpiry(),
        role: role as UserRole,
        adminProfile: {
          create: {
            permissions: {
              create: defaultPermissionIds.map((permissionId: string) => ({
                permissionId
              }))
            }
          }
        }
      },
      include: {
        adminProfile: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    auditAdmin.userCreate(auth.userId, newAdmin.id, {
      role: newAdmin.role,
      email: newAdmin.email,
    }, request);

    // Non-fatal: the account exists either way, and the invite can be re-sent
    // from the claim page.
    let inviteSent = false;
    try {
      const baseUrl = process.env.CLAIM_BASE_URL || appUrl();

      const result = await sendEmail({
        to: newAdmin.email,
        subject: "Activate your DFC account",
        templateName: "ClaimInvite",
        component: React.createElement(ClaimInvite, {
          name: newAdmin.name || "DFC Team",
          claimLink: buildClaimUrl(baseUrl, claimToken),
          expiryDays: CLAIM_TOKEN_TTL_DAYS,
        }),
        metadata: { reason: "admin-created", userId: newAdmin.id, role: newAdmin.role },
      });
      inviteSent = result.success;
    } catch (emailError) {
      logger.error("AdminAdminsClaimInvite", emailError);
    }

    return NextResponse.json({
      message: inviteSent
        ? "Admin created. An activation link has been emailed to them."
        : "Admin created, but the activation email could not be sent. Ask them to request a new link from the sign-in page.",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.adminProfile?.permissions.map(ap => ap.permission) || [],
      },
      inviteSent,
    });
  } catch (error) {
    logger.error('AdminAdmins', error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const adminWhere = search
      ? {
          role: { in: [UserRole.SECRETARIAT, UserRole.SUPERADMIN] },
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : { role: { in: [UserRole.SECRETARIAT, UserRole.SUPERADMIN] } };

    const [admins, totalAdmins, activeAdmins, superAdmins, newThisMonth] =
      await Promise.all([
        prisma.user.findMany({
          where: adminWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            adminProfile: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          },
        }),
        prisma.user.count({
          where: { role: { in: [UserRole.SECRETARIAT, UserRole.SUPERADMIN] } },
        }),
        prisma.user.count({
          where: {
            role: { in: [UserRole.SECRETARIAT, UserRole.SUPERADMIN] },
            isActive: true,
          },
        }),
        prisma.user.count({ where: { role: UserRole.SUPERADMIN } }),
        prisma.user.count({
          where: {
            role: { in: [UserRole.SECRETARIAT, UserRole.SUPERADMIN] },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return NextResponse.json({
      admins,
      stats: {
        totalAdmins,
        activeAdmins,
        superAdmins,
        newThisMonth,
      },
      pagination: {
        page,
        limit,
        total: totalAdmins,
        pages: Math.ceil(totalAdmins / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 },
    );
  }
}
