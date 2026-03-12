import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAdminAuth, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { calculateProfileScore } from '@/lib/utils/profile-score';
import { auditAdmin } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be VERIFIED or REJECTED.' },
        { status: 400 }
      );
    }

    const credential = await prisma.medicalCredential.findUnique({
      where: { id },
      include: { dfcMember: true },
    });

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Prisma.MedicalCredentialUpdateInput = { status };

    if (status === 'VERIFIED') {
      updateData.verifiedAt = new Date();
      updateData.verifiedById = auth.userId;
    }

    if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason || null;
    }

    // Update the credential
    const updated = await prisma.medicalCredential.update({
      where: { id },
      data: updateData,
    });

    const memberId = credential.dfcMemberId;

    // If verified, update DFCMember.lastVerifiedAt
    if (status === 'VERIFIED') {
      await prisma.dFCMember.update({
        where: { id: memberId },
        data: { lastVerifiedAt: new Date() },
      });
    }

    // Recalculate profileCompletionScore
    const member = await prisma.dFCMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { name: true, phone: true, profileImage: true } },
        credentials: { where: { status: 'VERIFIED' } },
        endorsementsReceived: true,
      },
    });

    if (member) {
      const score = calculateProfileScore({
        name: !!member.user.name,
        phone: !!member.user.phone,
        profileImage: !!member.user.profileImage,
        bio: !!member.bio && member.bio.length >= 50,
        specialty: !!member.credentials.some((c) => !!c.specialty),
        institution: !!member.institution,
        country: !!member.credentials.some((c) => !!c.country),
        credentials: member.credentials.length,
        endorsements: member.endorsementsReceived.length,
        whatsappOptIn: member.whatsappOptIn,
      });

      await prisma.dFCMember.update({
        where: { id: memberId },
        data: { profileCompletionScore: score },
      });
    }

    // Create notification for the member
    const credentialType = credential.type;
    let notificationTitle: string;
    let notificationMessage: string;

    if (status === 'VERIFIED') {
      notificationTitle = 'Credential Verified';
      notificationMessage = `Your ${credentialType} credential has been verified by the DFC Secretariat.`;
    } else {
      notificationTitle = 'Credential Rejected';
      notificationMessage = `Your ${credentialType} credential could not be verified. Reason: ${rejectionReason || 'No reason provided'}`;
    }

    await prisma.notification.create({
      data: {
        userId: credential.dfcMember.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'VERIFIED' ? 'success' : 'error',
      },
    });

    auditAdmin.userUpdate(auth.userId, credential.dfcMember.userId, {
      action: `credential_${status.toLowerCase()}`,
      credentialType: credential.type,
      credentialId: id,
    }, request);

    return NextResponse.json({ success: true, credential: updated });
  } catch (error) {
    logger.error('AdminCredentialDetail', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
