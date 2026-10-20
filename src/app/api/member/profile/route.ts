import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { generateDoctorSlug } from '@/lib/utils/slug';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        doctorProfile: { include: { specialty: true } },
        dfcMember: {
          include: {
            endorsementsReceived: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
      },
      doctorProfile: user.doctorProfile,
      dfcMember: user.dfcMember,
    });
  } catch (error) {
    logger.error('MemberProfile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const {
      name,
      phone,
      title,
      institution,
      city,
      country,
      specialty,
      subSpecialty,
      bio,
      mdcnNumber,
      whatsappOptIn,
      profileImage,
    } = body;

    await prisma.$transaction(async (tx) => {
      // Update User
      if (name || phone !== undefined || profileImage !== undefined) {
        await tx.user.update({
          where: { id: payload.userId },
          data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
            ...(profileImage !== undefined && { profileImage }),
          },
        });
      }

      // Members imported from the register were created without a
      // DoctorProfile, and this block used to run only "if exists" - so every
      // professional detail they entered was silently discarded and they never
      // appeared in search. Create the profile when it is missing.
      const doctorProfile = await tx.doctorProfile.findUnique({
        where: { userId: payload.userId },
      });

      let specialtyId = doctorProfile?.specialtyId ?? null;
      if (specialty) {
        let specialtyRecord = await tx.specialty.findFirst({
          where: { name: { equals: specialty, mode: 'insensitive' } },
        });
        if (!specialtyRecord) {
          specialtyRecord = await tx.specialty.create({ data: { name: specialty } });
        }
        specialtyId = specialtyRecord.id;
      }

      const profileFields = {
        ...(title !== undefined && { title }),
        ...(institution !== undefined && { institution }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(subSpecialty !== undefined && { subSpecialty }),
        ...(bio !== undefined && { bio }),
        ...(mdcnNumber !== undefined && { mdcnNumber }),
        ...(specialtyId && { specialtyId }),
      };

      if (doctorProfile) {
        await tx.doctorProfile.update({
          where: { userId: payload.userId },
          data: profileFields,
        });
      } else {
        const user = await tx.user.findUnique({
          where: { id: payload.userId },
          select: { name: true },
        });

        let slug = generateDoctorSlug(user?.name || 'member');
        let counter = 1;
        while (await tx.doctorProfile.findUnique({ where: { slug } })) {
          slug = generateDoctorSlug(user?.name || 'member', counter++);
        }

        await tx.doctorProfile.create({
          data: {
            userId: payload.userId,
            slug,
            experience: 0,
            ...profileFields,
          },
        });
      }

      // Update DFCMember if exists
      const dfcMember = await tx.dFCMember.findUnique({
        where: { userId: payload.userId },
      });
      if (dfcMember) {
        await tx.dFCMember.update({
          where: { userId: payload.userId },
          data: {
            ...(whatsappOptIn !== undefined && { whatsappOptIn }),
            ...(institution !== undefined && { institution }),
            ...(body.nigerianLicence !== undefined && { nigerianLicence: body.nigerianLicence }),
            ...(bio !== undefined && { bio }),
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    logger.error('MemberProfile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
