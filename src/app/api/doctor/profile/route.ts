import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true }
    });

    if (!user || user.role !== UserRole.DOCTOR || !user.doctorProfile) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { id: user.doctorProfile.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true
          }
        },
        _count: {
          select: {
            appointments: true,
            ratings: true
          }
        },
        ratings: {
          select: {
            rating: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Calculate average rating
    const avgRating = profile.ratings.length > 0
      ? profile.ratings.reduce((sum, r) => sum + r.rating, 0) / profile.ratings.length
      : 0;

    const responseData = {
      ...profile,
      avgRating,
      ratings: undefined // Remove ratings array from response
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { doctorProfile: true }
    });

    if (!user || user.role !== UserRole.DOCTOR || !user.doctorProfile) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { 
      name, 
      phone, 
      specialty, 
      experience, 
      bio, 
      consultationFee, 
      isAvailable 
    } = await request.json();

    // Update user information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone
      }
    });

    // Update doctor profile
    const updatedProfile = await prisma.doctorProfile.update({
      where: { id: user.doctorProfile.id },
      data: {
        specialty,
        experience,
        bio,
        consultationFee,
        isAvailable
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profileImage: true
          }
        },
        _count: {
          select: {
            appointments: true,
            ratings: true
          }
        },
        ratings: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate average rating
    const avgRating = updatedProfile.ratings.length > 0
      ? updatedProfile.ratings.reduce((sum, r) => sum + r.rating, 0) / updatedProfile.ratings.length
      : 0;

    const responseData = {
      ...updatedProfile,
      avgRating,
      ratings: undefined
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}