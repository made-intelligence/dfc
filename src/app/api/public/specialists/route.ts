import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const institution = searchParams.get('institution');
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    const slug = searchParams.get('slug');

    const where: Prisma.DFCMemberWhereInput = {
      category: 'MEMBER',
      user: {
        doctorProfile: { isNot: null },
      },
    };

    if (slug) {
      where.user = {
        ...where.user as Prisma.UserWhereInput,
        doctorProfile: { slug },
      };
    }

    if (status === 'verified' || status === 'ACTIVE') {
      where.status = 'ACTIVE';
    }

    const members = await prisma.dFCMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            doctorProfile: {
              select: {
                slug: true,
                specialty: { select: { name: true } },
                institution: true,
                city: true,
                bio: true,
                country: true,
                subSpecialty: true,
                title: true,
                // mdcnNumber excluded — sensitive credential, not for public API
              },
            },
          },
        },
        credentials: {
          where: { status: 'VERIFIED' },
          select: {
            id: true,
            type: true,
            registrationNumber: true,
            issuingBody: true,
            country: true,
            specialty: true,
            status: true,
            verifiedAt: true,
            createdAt: true,
          },
        },
        endorsementsReceived: {
          select: {
            id: true,
            relationshipType: true,
            statement: true,
            yearsKnown: true,
            createdAt: true,
            endorser: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Apply filters that depend on related DoctorProfile fields
    let filtered = members;
    if (specialty) {
      filtered = filtered.filter(
        (m) =>
          m.user.doctorProfile?.specialty?.name
            ?.toLowerCase()
            .includes(specialty.toLowerCase())
      );
    }
    if (institution) {
      filtered = filtered.filter(
        (m) =>
          m.user.doctorProfile?.institution
            ?.toLowerCase()
            .includes(institution.toLowerCase())
      );
    }
    if (city) {
      filtered = filtered.filter(
        (m) =>
          m.user.doctorProfile?.city
            ?.toLowerCase()
            .includes(city.toLowerCase())
      );
    }

    const specialists = filtered.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      profileImage: m.user.profileImage,
      slug: m.user.doctorProfile?.slug,
      specialty: m.user.doctorProfile?.specialty?.name,
      subSpecialty: m.user.doctorProfile?.subSpecialty,
      institution: m.user.doctorProfile?.institution,
      city: m.user.doctorProfile?.city,
      country: m.user.doctorProfile?.country,
      bio: m.user.doctorProfile?.bio,
      title: m.user.doctorProfile?.title,
      // mdcnNumber removed — not exposed publicly
      status: m.status,
      category: m.category,
      endorsementCount: m.endorsementsReceived.length,
      profileCompletionScore: m.profileCompletionScore,
      lastVerifiedAt: m.lastVerifiedAt,
      credentials: m.credentials,
      endorsements: m.endorsementsReceived.map((e) => ({
        id: e.id,
        endorserName: e.endorser.user.name,
        endorserId: e.endorser.id,
        relationshipType: e.relationshipType,
        statement: e.statement,
        yearsKnown: e.yearsKnown,
        createdAt: e.createdAt,
      })),
    }));

    return NextResponse.json(
      { success: true, specialists },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (error) {
    logger.error('PublicSpecialists', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
