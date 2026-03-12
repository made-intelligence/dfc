import { prisma } from "@/lib/prisma";

export async function getDefaultPermissionsByRole(role: string) {
  if (role === 'SUPERADMIN') {
    // Super admins get all permissions
    return await prisma.permission.findMany({
      where: { isActive: true }
    });
  } else if (role === 'SECRETARIAT') {
    // Regular admins get basic permissions (excluding admin management and system control)
    return await prisma.permission.findMany({
      where: {
        isActive: true,
        category: { notIn: ['admin_management', 'system'] }
      }
    });
  }
  return [];
}

export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return user?.adminProfile?.permissions.map(ap => ap.permission) || [];
}

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.name === permissionName);
}