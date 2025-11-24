import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  hashPassword, 
  createToken, 
  createAuthCookie, 
  validateEmail,
  validatePassword,
  validatePhone,
  AuthError,
  AUTH_ERRORS 
} from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  // Role-specific fields
  specialty?: string; // For doctors
  license?: string; // For doctors
  experience?: number; // For doctors
  dateOfBirth?: string; // For patients
  gender?: string; // For patients
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      specialty,
      license,
      experience,
      dateOfBirth,
      gender
    } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Role-specific validation
    if (role === UserRole.DOCTOR) {
      if (!specialty || !license || experience === undefined) {
        return NextResponse.json(
          { error: 'Specialty, license, and experience are required for doctors' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if doctor license already exists
    if (role === UserRole.DOCTOR && license) {
      const existingDoctor = await prisma.doctorProfile.findUnique({
        where: { license },
      });

      if (existingDoctor) {
        return NextResponse.json(
          { error: 'Doctor with this license already exists' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          role,
        },
      });

      // Create role-specific profile
      if (role === UserRole.ADMIN) {
        await tx.adminProfile.create({
          data: {
            userId: user.id,
            permissions: JSON.stringify(['manage_users', 'manage_doctors', 'view_analytics']),
          },
        });
      } else if (role === UserRole.DOCTOR) {
        await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialty: specialty!,
            license: license!,
            experience: experience!,
            consultationFee: 0, // Default, can be updated later
          },
        });
      } else if (role === UserRole.PATIENT) {
        await tx.patientProfile.create({
          data: {
            userId: user.id,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
          },
        });
      }

      return user;
    });

    // Create JWT token
    const token = await createToken({
      userId: result.id,
      email: result.email,
      role: result.role,
      name: result.name,
    });

    // Prepare user data for response
    const userData = {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      phone: result.phone,
    };

    // Create response with auth cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      token,
      message: 'Account created successfully',
    }, { status: 201 });

    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
