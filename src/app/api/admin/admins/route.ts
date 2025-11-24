import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const adminWhere = search ? {
      role: { in: ['ADMIN', 'SUPERADMIN'] },
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : { role: { in: ['ADMIN', 'SUPERADMIN'] } };

    const [admins, totalAdmins, activeAdmins, superAdmins, newThisMonth] = await Promise.all([
      prisma.user.findMany({
        where: adminWhere,
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
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, isActive: true } }),
      prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      prisma.user.count({
        where: {
          role: { in: ['ADMIN', 'SUPERADMIN'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return NextResponse.json({
      admins,
      stats: {
        totalAdmins,
        activeAdmins,
        superAdmins,
        newThisMonth
      },
      pagination: {
        page,
        limit,
        total: totalAdmins,
        pages: Math.ceil(totalAdmins / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}