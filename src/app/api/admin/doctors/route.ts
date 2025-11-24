import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' as const } } },
        { specialty: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [doctors, totalDoctors, activeDoctors, avgRating, newThisMonth] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true
            }
          },
          ratings: {
            select: { rating: true }
          },
          appointments: {
            where: { status: 'COMPLETED' },
            select: { id: true }
          }
        }
      }),
      prisma.doctorProfile.count(),
      prisma.doctorProfile.count({ where: { isAvailable: true } }),
      prisma.doctorRating.aggregate({ _avg: { rating: true } }),
      prisma.doctorProfile.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const doctorsWithStats = doctors.map(doctor => ({
      id: doctor.user.id,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.specialty,
      consultationFee: doctor.consultationFee,
      isActive: doctor.user.isActive,
      rating: doctor.ratings.length > 0 
        ? doctor.ratings.reduce((sum, r) => sum + r.rating, 0) / doctor.ratings.length 
        : 0,
      totalPatients: doctor.appointments.length,
      joinDate: doctor.createdAt
    }));

    return NextResponse.json({
      doctors: doctorsWithStats,
      stats: {
        totalDoctors,
        activeDoctors,
        avgRating: avgRating._avg.rating || 0,
        newThisMonth
      },
      pagination: {
        page,
        limit,
        total: totalDoctors,
        pages: Math.ceil(totalDoctors / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}