import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { specialistUserId, relationshipType, statement, yearsKnown } = await request.json();

    if (!specialistUserId || !relationshipType || !statement) {
      return NextResponse.json(
        { error: 'specialistUserId, relationshipType, and statement are required' },
        { status: 400 }
      );
    }

    if (typeof statement !== 'string' || statement.length < 80) {
      return NextResponse.json(
        { error: 'Endorsement statement must be at least 80 characters' },
        { status: 400 }
      );
    }

    if (typeof statement === 'string' && statement.length > 500) {
      return NextResponse.json(
        { error: 'Endorsement statement must not exceed 500 characters' },
        { status: 400 }
      );
    }

    // Endorser must be a DFC Full Member
    const endorser = await prisma.dFCMember.findUnique({
      where: { userId: payload.userId },
    });
    if (!endorser || endorser.category !== 'MEMBER' || endorser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active DFC Full Members can endorse specialists' },
        { status: 403 }
      );
    }

    // Specialist must exist as a DFC member
    const specialist = await prisma.dFCMember.findUnique({
      where: { userId: specialistUserId },
    });
    if (!specialist) {
      return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    }

    if (specialist.userId === payload.userId) {
      return NextResponse.json({ error: 'You cannot endorse yourself' }, { status: 400 });
    }

    // Check existing endorsement
    const existing = await prisma.endorsementRecord.findUnique({
      where: {
        endorserId_endorsedId: {
          endorserId: endorser.id,
          endorsedId: specialist.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already endorsed this specialist' },
        { status: 409 }
      );
    }

    // Create endorsement
    await prisma.endorsementRecord.create({
      data: {
        endorserId: endorser.id,
        endorsedId: specialist.id,
        relationshipType,
        statement,
        yearsKnown: yearsKnown ? parseInt(yearsKnown, 10) : null,
        attestation: true,
      },
    });

    // Count endorsements
    const endorsementCount = await prisma.endorsementRecord.count({
      where: { endorsedId: specialist.id },
    });

    // Check for verified credentials
    const verifiedCredentialCount = await prisma.medicalCredential.count({
      where: {
        dfcMemberId: specialist.id,
        status: 'VERIFIED',
      },
    });

    let specialistNowVerified = false;

    // If 2+ endorsements, has verified credential, and specialist is SUSPENDED or PENDING → activate
    if (
      endorsementCount >= 2 &&
      verifiedCredentialCount >= 1 &&
      (specialist.status === 'SUSPENDED' || specialist.status === 'PENDING')
    ) {
      await prisma.dFCMember.update({
        where: { id: specialist.id },
        data: {
          status: 'ACTIVE',
          lastVerifiedAt: new Date(),
        },
      });
      specialistNowVerified = true;

      // Notify specialist
      await prisma.notification.create({
        data: {
          userId: specialist.userId,
          title: 'Verification complete',
          message:
            'Your DFC profile has been verified. You are now visible in the specialist directory.',
          type: 'success',
          link: '/member',
        },
      });

      // Notify secretariat
      await prisma.secretariatTicket.create({
        data: {
          source: 'SYSTEM',
          status: 'OPEN',
          requestType: 'MEMBERSHIP_QUERY',
          rawMessage: `Specialist ${specialist.userId} has received ${endorsementCount} peer endorsements and has ${verifiedCredentialCount} verified credential(s). Auto-activated. Please review.`,
          fromName: 'System',
          subject: 'Auto-verification: peer endorsement threshold met',
        },
      });
    }

    // Notify specialist of new endorsement (always)
    if (!specialistNowVerified) {
      await prisma.notification.create({
        data: {
          userId: specialist.userId,
          title: 'New peer endorsement',
          message: `You received a peer endorsement. You now have ${endorsementCount} endorsement(s).`,
          type: 'info',
          link: '/member',
        },
      });
    }

    // Recalculate profile completion score
    const memberData = await prisma.dFCMember.findUnique({
      where: { id: specialist.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
            doctorProfile: {
              select: {
                bio: true,
                specialty: true,
                institution: true,
                city: true,
                country: true,
                mdcnNumber: true,
              },
            },
          },
        },
        credentials: { where: { status: 'VERIFIED' } },
        endorsementsReceived: true,
      },
    });

    if (memberData) {
      let score = 0;
      const dp = memberData.user.doctorProfile;
      if (memberData.user.name) score += 10;
      if (memberData.user.email) score += 5;
      if (memberData.user.profileImage) score += 10;
      if (dp?.bio) score += 10;
      if (dp?.specialty) score += 10;
      if (dp?.institution) score += 10;
      if (dp?.city) score += 5;
      if (dp?.country) score += 5;
      if (dp?.mdcnNumber) score += 5;
      if (memberData.credentials.length > 0) score += 15;
      const endorsements = memberData.endorsementsReceived.length;
      score += Math.min(endorsements, 2) * 7; // up to 14 points for endorsements
      if (memberData.status === 'ACTIVE') score = Math.max(score, 85);
      score = Math.min(score, 100);

      await prisma.dFCMember.update({
        where: { id: specialist.id },
        data: { profileCompletionScore: score },
      });
    }

    return NextResponse.json({
      success: true,
      endorsementCount,
      specialistNowVerified,
    });
  } catch (error) {
    logger.error('MemberEndorse', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
