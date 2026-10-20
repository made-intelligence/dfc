import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { auditAdmin } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { BUILT_IN_PERMISSIONS } from "@/lib/permission-names";

// PATCH — edit a permission's description, category or active flag.
// The name is the key code checks against, so it is not editable.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const { description, category, isActive } = await request.json();

    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    if (isActive === false && BUILT_IN_PERMISSIONS.has(permission.name)) {
      return NextResponse.json(
        { error: "This permission is used by the application and cannot be deactivated" },
        { status: 400 }
      );
    }

    const data: { description?: string; category?: string; isActive?: boolean } = {};
    if (typeof description === "string") {
      if (!description.trim() || description.length > 500) {
        return NextResponse.json({ error: "Description must be 1-500 characters" }, { status: 400 });
      }
      data.description = description.trim();
    }
    if (typeof category === "string") {
      const normalised = category.trim().toLowerCase().replace(/\s+/g, "_");
      if (!/^[a-z_]{1,50}$/.test(normalised)) {
        return NextResponse.json(
          { error: "Category may contain only letters and underscores" },
          { status: 400 }
        );
      }
      data.category = normalised;
    }
    if (typeof isActive === "boolean") data.isActive = isActive;

    const updated = await prisma.permission.update({ where: { id }, data });

    auditAdmin.permissionChange(auth.userId, id, { action: "updated", name: permission.name, ...data }, request);

    return NextResponse.json({ success: true, permission: updated });
  } catch (error) {
    logger.error("AdminPermissionUpdate", error);
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
}

// DELETE — remove a custom permission (its admin grants cascade).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: { _count: { select: { adminProfiles: true } } },
    });
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    if (BUILT_IN_PERMISSIONS.has(permission.name)) {
      return NextResponse.json(
        { error: "This permission is used by the application and cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.permission.delete({ where: { id } });

    auditAdmin.permissionChange(auth.userId, id, {
      action: "deleted",
      name: permission.name,
      revokedFromAdmins: permission._count.adminProfiles,
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("AdminPermissionDelete", error);
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
}
