import 'server-only';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function checkRecordAccess(
  accessingUserId: string,
  accessingUserRole: UserRole,
  patientId: string,
  action: 'VIEWED' | 'CREATED' | 'UPDATED' | 'DOWNLOADED',
  resourceType: string,
  resourceId?: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const hasAdminAccess =
    accessingUserRole === UserRole.SUPERADMIN ||
    accessingUserRole === UserRole.SECRETARIAT;

  let physicianAllowed = false;
  if (accessingUserRole === UserRole.DFC_MEMBER) {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: accessingUserId },
    });
    if (doctorProfile) {
      // Check appointment relationship
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { id: patientId },
        select: { userId: true },
      });
      if (patientProfile) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            doctorId: accessingUserId,
            patientId: patientProfile.userId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
        });
        if (appointment) physicianAllowed = true;
      }

      // Check explicit access grant
      const grant = await prisma.recordAccessGrant.findUnique({
        where: { patientId_grantedToId: { patientId, grantedToId: doctorProfile.id } },
      });
      if (grant && grant.isActive && (!grant.expiresAt || grant.expiresAt > new Date())) {
        physicianAllowed = true;
      }
    }
  }

  let patientAllowed = false;
  if (accessingUserRole === UserRole.PATIENT) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: accessingUserId },
    });
    if (profile && profile.id === patientId) patientAllowed = true;
  }

  const allowed = hasAdminAccess || physicianAllowed || patientAllowed;

  // Always log access
  await prisma.recordAccessLog.create({
    data: {
      patientId,
      accessedById: accessingUserId,
      action,
      resourceType,
      resourceId,
    },
  }).catch(() => {});

  if (!allowed) {
    return { allowed: false, reason: 'You do not have permission to access this patient record.' };
  }

  return { allowed: true };
}
