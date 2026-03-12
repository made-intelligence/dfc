import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause for DFCMembers
    const dfcWhere: Prisma.DFCMemberWhereInput = {};
    if (status) dfcWhere.status = status as Prisma.EnumDFCMemberStatusFilter;
    if (category) dfcWhere.category = category as Prisma.EnumDFCMemberCategoryFilter;

    if (search) {
      dfcWhere.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      };
    }

    const [members, totalMembers, activeMembers, pendingMembers, newThisMonth, byCategory] =
      await Promise.all([
        prisma.dFCMember.findMany({
          where: dfcWhere,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                profileImage: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.dFCMember.count(),
        prisma.dFCMember.count({ where: { status: "ACTIVE" } }),
        prisma.dFCMember.count({ where: { status: "PENDING" } }),
        prisma.dFCMember.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.dFCMember.groupBy({
          by: ["category"],
          _count: true,
        }),
      ]);

    const users = members.map((m) => ({
      id: m.user.id,
      memberId: m.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      role: m.user.role,
      isActive: m.user.isActive,
      profileImage: m.user.profileImage,
      createdAt: m.user.createdAt,
      category: m.category,
      memberStatus: m.status,
      goodStanding: m.goodStanding,
      path: m.path,
      memberNumber: m.memberNumber,
      duesStatus: m.duesStatus,
      excoPosition: m.excoPosition,
      isBotMember: m.isBotMember,
    }));

    const categoryBreakdown = Object.fromEntries(
      byCategory.map((c) => [c.category, c._count])
    );

    return NextResponse.json({
      users,
      stats: {
        totalMembers,
        activeMembers,
        pendingMembers,
        newThisMonth,
        categoryBreakdown,
      },
      pagination: {
        page,
        limit,
        total: totalMembers,
        pages: Math.ceil(totalMembers / limit),
      },
    });
  } catch (error) {
    logger.error('AdminUsers', error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}
