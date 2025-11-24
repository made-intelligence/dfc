import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create superadmin user
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@dfc.com' },
    update: {},
    create: {
      email: 'superadmin@dfc.com',
      password: superAdminPassword,
      name: 'Super Administrator',
      phone: '+234 800 123 4567',
      role: UserRole.SUPERADMIN,
      adminProfile: {
        create: {
          permissions: JSON.stringify([
            'manage_users',
            'manage_doctors',
            'manage_patients',
            'manage_admins',
            'view_analytics',
            'system_settings',
            'full_control'
          ]),
        },
      },
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dfc.com' },
    update: {},
    create: {
      email: 'admin@dfc.com',
      password: adminPassword,
      name: 'System Administrator',
      phone: '+234 801 234 5678',
      role: UserRole.ADMIN,
      adminProfile: {
        create: {
          permissions: JSON.stringify([
            'manage_users',
            'manage_doctors',
            'manage_patients',
            'view_analytics',
            'system_settings'
          ]),
        },
      },
    },
  });

  // Create sample doctor
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@dfc.com' },
    update: {},
    create: {
      email: 'doctor@dfc.com',
      password: doctorPassword,
      name: 'Dr. Sarah Johnson',
      phone: '+234 802 345 6789',
      role: UserRole.DOCTOR,
      doctorProfile: {
        create: {
          specialty: 'Cardiology',
          license: 'MD-001-2024',
          experience: 10,
          consultationFee: 15000,
          currency: 'NGN',
          bio: 'Experienced cardiologist with over 10 years of practice in cardiovascular medicine.',
        },
      },
    },
    include: {
      doctorProfile: true,
    },
  });

  // Create sample patient
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patient = await prisma.user.upsert({
    where: { email: 'patient@dfc.com' },
    update: {},
    create: {
      email: 'patient@dfc.com',
      password: patientPassword,
      name: 'John Doe',
      phone: '+234 803 456 7890',
      role: UserRole.PATIENT,
      patientProfile: {
        create: {
          dateOfBirth: new Date('1990-05-15'),
          gender: 'male',
          address: '123 Main Street, Lagos, Nigeria',
          emergencyContact: '+234 804 567 8901',
          bloodGroup: 'O+',
          allergies: JSON.stringify(['Penicillin', 'Shellfish']),
        },
      },
    },
    include: {
      patientProfile: true,
    },
  });

  // Create doctor schedule
  if (doctor.doctorProfile) {
    const scheduleData = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' }, // Friday
    ];

    for (const schedule of scheduleData) {
      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: doctor.doctorProfile.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
          },
        },
        update: {},
        create: {
          doctorId: doctor.doctorProfile.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        },
      });
    }

    // Create sample appointments
    const appointments = [
      {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: new Date('2024-01-15'),
        startTime: '10:00',
        endTime: '10:30',
        status: 'COMPLETED',
        reason: 'Regular checkup',
        consultationFee: 15000,
      },
      {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: new Date('2024-01-20'),
        startTime: '14:00',
        endTime: '14:30',
        status: 'CONFIRMED',
        reason: 'Follow-up consultation',
        consultationFee: 15000,
      },
    ];

    for (const appointmentData of appointments) {
      const appointment = await prisma.appointment.upsert({
        where: {
          id: `appointment-${appointmentData.patientId}-${appointmentData.appointmentDate.getTime()}`,
        },
        update: {},
        create: {
          ...appointmentData,
          id: `appointment-${appointmentData.patientId}-${appointmentData.appointmentDate.getTime()}`,
        },
      });

      // Create medical record for completed appointment
      if (appointmentData.status === 'COMPLETED') {
        await prisma.medicalRecord.upsert({
          where: { appointmentId: appointment.id },
          update: {},
          create: {
            appointmentId: appointment.id,
            patientId: patient.patientProfile!.id,
            doctorId: doctor.doctorProfile.id,
            diagnosis: 'Hypertension - well controlled',
            symptoms: 'Mild headaches, occasional dizziness',
            treatment: 'Continue current medication, lifestyle modifications',
            medications: JSON.stringify(['Lisinopril 10mg daily', 'Hydrochlorothiazide 25mg daily']),
            followUpDate: new Date('2024-02-15'),
            notes: 'Patient responding well to treatment. Blood pressure stable.',
          },
        });
      }
    }

    // Create sample subscription
    await prisma.doctorSubscription.upsert({
      where: {
        id: `subscription-${doctor.doctorProfile.id}`,
      },
      update: {},
      create: {
        id: `subscription-${doctor.doctorProfile.id}`,
        doctorId: doctor.doctorProfile.id,
        planName: 'Professional',
        amount: 12000,
        currency: 'NGN',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-04-01'),
        paymentReference: 'DFC-2024-001-PROF',
      },
    });

    // Create sample rating
    await prisma.doctorRating.upsert({
      where: {
        doctorId_patientId: {
          doctorId: doctor.doctorProfile.id,
          patientId: patient.patientProfile!.id,
        },
      },
      update: {},
      create: {
        doctorId: doctor.doctorProfile.id,
        patientId: patient.patientProfile!.id,
        rating: 4.8,
        review: 'Excellent doctor! Very professional and caring. Highly recommend.',
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Super Admin: superadmin@dfc.com / superadmin123');
  console.log('Admin: admin@dfc.com / admin123');
  console.log('Doctor: doctor@dfc.com / doctor123');
  console.log('Patient: patient@dfc.com / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
