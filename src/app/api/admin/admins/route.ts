import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getDefaultPermissionsByRole } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, role, permissionIds } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const defaultPassword = await bcrypt.hash('admin123', 12);
    
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
        password: defaultPassword,
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

    return NextResponse.json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.adminProfile?.permissions.map(ap => ap.permission) || []
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const adminWhere = search
      ? {
          role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } };

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
          where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
        }),
        prisma.user.count({
          where: {
            role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
            isActive: true,
          },
        }),
        prisma.user.count({ where: { role: UserRole.SUPERADMIN } }),
        prisma.user.count({
          where: {
            role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
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
