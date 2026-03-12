import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { UserRole, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { auditAdmin } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!admin || (admin.role !== UserRole.SECRETARIAT && admin.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // id could be either a DFCMember id or a User id
    const member = await prisma.dFCMember.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
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
            doctorProfile: {
              select: {
                specialty: { select: { name: true } },
                institution: true,
                city: true,
                country: true,
                experience: true,
                title: true,
                mdcnNumber: true,
                diasporaLicence: true,
                subSpecialty: true,
                bio: true,
                consultationFee: true,
                isAvailable: true,
              },
            },
          },
        },
        endorsementsReceived: {
          select: {
            id: true,
            relationshipType: true,
            statement: true,
            createdAt: true,
            endorser: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get second opinion cases assigned to this member
    let assignedCases: Array<{ id: string; reference: string; status: string; tier: string; specialty: string; createdAt: Date }> = [];
    if (member.user.doctorProfile) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: member.user.id },
        select: { id: true },
      });
      if (doctor) {
        try {
          assignedCases = await prisma.secondOpinionCase.findMany({
            where: { specialistId: doctor.id },
            select: {
              id: true,
              reference: true,
              status: true,
              tier: true,
              specialty: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          });
        } catch {}
      }
    }

    // Get initiative memberships
    let initiatives: Array<{ role: string; initiative?: { name: string; type: string; status: string } | null }> = [];
    try {
      initiatives = await prisma.initiativeMember.findMany({
        where: { dfcMemberId: member.id },
        include: {
          initiative: {
            select: { name: true, type: true, status: true },
          },
        },
      });
    } catch {}

    return NextResponse.json({
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      phone: member.user.phone,
      profileImage: member.user.profileImage,
      role: member.user.role,
      isActive: member.user.isActive,
      joinedAt: member.user.createdAt,
      // DFC Member fields
      category: member.category,
      memberStatus: member.status,
      memberNumber: member.memberNumber,
      path: member.path,
      goodStanding: member.goodStanding,
      duesStatus: member.duesStatus,
      duesPaidAmount: member.duesPaidAmount,
      effectiveDate: member.effectiveDate,
      excoPosition: member.excoPosition,
      excoElectedAt: member.excoElectedAt,
      isBotMember: member.isBotMember,
      // Doctor profile
      doctorProfile: member.user.doctorProfile,
      // Related data
      endorsements: member.endorsementsReceived.map((e) => ({
        id: e.id,
        endorserName: e.endorser?.user?.name || "Unknown",
        relationshipType: e.relationshipType,
        statement: e.statement,
        date: e.createdAt,
      })),
      assignedCases,
      initiatives: initiatives.map((im) => ({
        name: im.initiative?.name,
        type: im.initiative?.type,
        status: im.initiative?.status,
        role: im.role,
      })),
    });
  } catch (error) {
    logger.error('AdminUserDetail', error);
    return NextResponse.json(
      { error: "Failed to fetch member details" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!admin || (admin.role !== UserRole.SECRETARIAT && admin.role !== UserRole.SUPERADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const member = await prisma.dFCMember.findFirst({
      where: { OR: [{ id }, { userId: id }] },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const data: Prisma.DFCMemberUpdateInput = {};
    if (body.status) data.status = body.status;
    if (body.category) data.category = body.category;
    if (body.goodStanding !== undefined) data.goodStanding = body.goodStanding;
    if (body.duesStatus) data.duesStatus = body.duesStatus;
    if (body.path) data.path = body.path;

    const updated = await prisma.dFCMember.update({
      where: { id: member.id },
      data,
    });

    // Audit member status change
    auditAdmin.memberStatusChange(payload.userId, member.id, {
      changes: body,
      memberId: member.id,
    }, request);

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    logger.error('AdminUserUpdate', error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
  }
}
