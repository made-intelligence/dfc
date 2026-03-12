import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { calculateProfileScore } from '@/lib/utils/profile-score';
import { logger } from '@/lib/logger';

const ISSUING_BODY_MAP: Record<string, string> = {
  MDCN: 'Medical and Dental Council of Nigeria',
  GMC: 'General Medical Council (UK)',
  HPCSA: 'Health Professions Council of South Africa',
  AMA: 'American Medical Association',
  CPSO: 'College of Physicians and Surgeons of Ontario',
  AHPRA: 'Australian Health Practitioner Regulation Agency',
  IMC: 'Irish Medical Council',
};

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const dfcMember = await prisma.dFCMember.findUnique({
      where: { userId: payload.userId },
    });

    if (!dfcMember) {
      return NextResponse.json({ error: 'DFC member profile not found' }, { status: 404 });
    }

    const credentials = await prisma.medicalCredential.findMany({
      where: { dfcMemberId: dfcMember.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    logger.error('MemberCredentials', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const {
      type,
      registrationNumber,
      issuingBody,
      country,
      specialty,
      subSpecialty,
      issueDate,
      expiryDate,
      documentUrl,
    } = body;

    if (!type || !registrationNumber) {
      return NextResponse.json(
        { error: 'type and registrationNumber are required' },
        { status: 400 }
      );
    }

    const dfcMember = await prisma.dFCMember.findUnique({
      where: { userId: payload.userId },
    });

    if (!dfcMember) {
      return NextResponse.json({ error: 'DFC member profile not found' }, { status: 404 });
    }

    const resolvedIssuingBody = issuingBody || ISSUING_BODY_MAP[type] || type;

    const credential = await prisma.medicalCredential.create({
      data: {
        dfcMemberId: dfcMember.id,
        type,
        registrationNumber,
        issuingBody: resolvedIssuingBody,
        country: country || '',
        specialty: specialty || null,
        subSpecialty: subSpecialty || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        status: 'UNVERIFIED',
      },
    });

    // Notify all SECRETARIAT users
    const secretariatUsers = await prisma.user.findMany({
      where: { role: 'SECRETARIAT' },
      select: { id: true },
    });

    if (secretariatUsers.length > 0) {
      await prisma.notification.createMany({
        data: secretariatUsers.map((u) => ({
          userId: u.id,
          title: 'New Credential Submitted',
          message: `New credential submitted for verification: ${type} - ${registrationNumber}`,
          type: 'info',
          link: `/admin/secretariat/credentials`,
        })),
      });
    }

    // Recalculate profile completion score
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        doctorProfile: { include: { specialty: true } },
        dfcMember: {
          include: {
            credentials: true,
            endorsementsReceived: true,
          },
        },
      },
    });

    if (user && user.dfcMember) {
      const verifiedCredentials = user.dfcMember.credentials.filter(
        (c) => c.status === 'VERIFIED'
      ).length;

      const newScore = calculateProfileScore({
        name: !!user.name,
        phone: !!user.phone,
        profileImage: !!user.profileImage,
        bio: !!(user.dfcMember.bio && user.dfcMember.bio.length >= 50),
        specialty: !!user.doctorProfile?.specialty,
        institution: !!user.dfcMember.institution,
        country: !!user.doctorProfile?.country,
        credentials: verifiedCredentials,
        endorsements: user.dfcMember.endorsementsReceived.length,
        whatsappOptIn: user.dfcMember.whatsappOptIn,
      });

      await prisma.dFCMember.update({
        where: { id: user.dfcMember.id },
        data: { profileCompletionScore: newScore },
      });
    }

    return NextResponse.json({ success: true, credential }, { status: 201 });
  } catch (error) {
    logger.error('MemberCredentials', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
