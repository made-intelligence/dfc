import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const patientWhere = search ? {
      role: 'PATIENT',
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : { role: 'PATIENT' };

    const [users, totalPatients, activePatients, totalDoctors, newThisMonth] = await Promise.all([
      prisma.user.findMany({
        where: patientWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'PATIENT', isActive: true } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({
        where: {
          role: 'PATIENT',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return NextResponse.json({
      users,
      stats: {
        totalPatients,
        activePatients,
        totalDoctors,
        newThisMonth
      },
      pagination: {
        page,
        limit,
        total: totalPatients,
        pages: Math.ceil(totalPatients / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}