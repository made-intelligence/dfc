import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  validateEmail,
  validatePassword,
  createToken,
  createAuthCookie,
  JWTPayload,
} from '@/lib/auth';
import { generateDoctorSlug } from '@/lib/utils/slug';
import { UserRole, DFCMemberCategory, DFCMemberStatus } from '@prisma/client';
import { logger } from '@/lib/logger';
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const {
      title,
      name,
      email,
      password,
      phone,
      specialty,
      subSpecialty,
      licenceNumber,
      institution,
      country,
      nigerianLicence,
      yearsQualified,
      path,
      whatsappOptIn,
    } = body;

    // Validate required fields
    const errors: string[] = [];
    if (!name?.trim()) errors.push('Full name is required');
    if (!email?.trim()) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!path || !['diaspora', 'local_specialist', 'associate'].includes(path)) {
      errors.push('Valid membership pathway is required');
    }

    if (email && !validateEmail(email)) {
      errors.push('Invalid email address');
    }

    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Generate unique slug (batch candidate check)
    const candidates = [generateDoctorSlug(name), ...Array.from({ length: 9 }, (_, i) => generateDoctorSlug(name, i + 1))];
    const existingSlugs = await prisma.doctorProfile.findMany({
      where: { slug: { in: candidates } },
      select: { slug: true },
    });
    const takenSlugs = new Set(existingSlugs.map(e => e.slug));
    const slug = candidates.find(c => !takenSlugs.has(c)) || generateDoctorSlug(name, Date.now());

    // Find or create specialty
    let specialtyId: string | null = null;
    if (specialty) {
      let specialtyRecord = await prisma.specialty.findFirst({
        where: { name: { equals: specialty, mode: 'insensitive' } },
      });
      if (!specialtyRecord) {
        specialtyRecord = await prisma.specialty.create({ data: { name: specialty } });
      }
      specialtyId = specialtyRecord.id;
    }

    // Determine DFCMember category and status
    const categoryMap: Record<string, DFCMemberCategory> = {
      diaspora: DFCMemberCategory.MEMBER,
      local_specialist: DFCMemberCategory.MEMBER,
      associate: DFCMemberCategory.ASSOCIATE_MEMBER,
    };
    const statusMap: Record<string, DFCMemberStatus> = {
      diaspora: DFCMemberStatus.PENDING,
      local_specialist: DFCMemberStatus.PENDING,
      associate: DFCMemberStatus.ACTIVE,
    };

    const experience = yearsQualified
      ? Math.max(0, new Date().getFullYear() - parseInt(yearsQualified, 10))
      : 0;

    // Transaction: create User + profiles + DFCMember + ticket
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          role: UserRole.DFC_MEMBER,
          profileImage: null,
        },
      });

      await tx.patientProfile.create({
        data: { userId: user.id },
      });

      if (path === 'diaspora' || path === 'local_specialist') {
        await tx.doctorProfile.create({
          data: {
            userId: user.id,
            slug,
            license: licenceNumber || null,
            experience,
            bio: null,
            specialtyId,
            institution: institution || null,
            city: null,
            country: country || (path === 'local_specialist' ? 'Nigeria' : 'United Kingdom'),
            subSpecialty: subSpecialty || null,
            title: title || null,
            mdcnNumber: nigerianLicence || null,
            diasporaLicence: path === 'diaspora' ? licenceNumber : null,
          },
        });
      }

      const dfcMember = await tx.dFCMember.create({
        data: {
          userId: user.id,
          category: categoryMap[path],
          status: statusMap[path],
          goodStanding: false,
          path,
          whatsappOptIn: whatsappOptIn ?? true,
        },
      });

      // Create a secretariat ticket for credential verification
      await tx.secretariatTicket.create({
        data: {
          userId: user.id,
          source: 'WEB',
          status: 'OPEN',
          requestType: 'MEMBERSHIP_QUERY',
          intent: 'MEMBERSHIP_QUERY',
          rawMessage: `New membership application: ${name} applying as ${path}. Specialty: ${specialty || 'Not specified'}. Institution: ${institution || 'Not specified'}. Please verify credentials.`,
          subject: `Membership application — ${name}`,
          fromPhone: phone || null,
          fromName: name,
        },
      });

      return { user, dfcMember };
    });

    // Create JWT
    const tokenPayload: JWTPayload = {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      name: result.user.name,
    };
    const token = await createToken(tokenPayload);

    // Message based on path
    const messages: Record<string, string> = {
      diaspora:
        'Application received. Your credentials will be verified within 5 working days.',
      local_specialist:
        'Application received. You will need two DFC member endorsements to complete verification.',
      associate: 'Welcome to DFC. Your associate membership is active.',
    };

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        token,
        path,
        message: messages[path],
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', createAuthCookie(token));

    // Non-blocking: send welcome WhatsApp if opted in
    if (phone && whatsappOptIn) {
      import('@/lib/whatsapp/service').then(({ sendWelcomeMessage }) => {
        sendWelcomeMessage(phone, name, result.user.id).catch((err) => logger.error('JoinWelcomeWhatsApp', err));
      });
    }

    return response;
  } catch (error) {
    logger.error('JoinRegistration', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
