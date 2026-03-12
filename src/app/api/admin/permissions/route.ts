import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });

    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({
      permissions,
      groupedPermissions
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { name, description, category } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    const existingPermission = await prisma.permission.findUnique({
      where: { name }
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: "Permission with this name already exists" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        description,
        category: category || "general"
      }
    });

    return NextResponse.json({
      message: "Permission created successfully",
      permission
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}