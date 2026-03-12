import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.doctorRating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.adminPermission.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.permission.deleteMany();
  
  console.log('🧹 Cleaned existing data...');

  // Create permissions first
  const permissionsData = [
    { name: 'manage_users', description: 'Create, read, update, and delete users', category: 'user_management' },
    { name: 'manage_doctors', description: 'Manage doctor profiles and verification', category: 'user_management' },
    { name: 'manage_patients', description: 'Manage patient profiles and records', category: 'user_management' },
    { name: 'manage_admins', description: 'Create and manage admin accounts', category: 'admin_management' },
    { name: 'view_analytics', description: 'Access platform analytics and reports', category: 'analytics' },
    { name: 'system_settings', description: 'Configure system-wide settings', category: 'system' },
    { name: 'manage_permissions', description: 'Create and assign permissions', category: 'admin_management' },
    { name: 'full_control', description: 'Complete system access (Super Admin only)', category: 'system' }
  ];

  const createdPermissions = [];
  for (const permissionData of permissionsData) {
    const permission = await prisma.permission.create({
      data: permissionData
    });
    createdPermissions.push(permission);
  }
  
  console.log('✅ Created permissions...');

  // Create specialties first
  const specialties = [
    { name: "Cardiology", description: "Heart and cardiovascular system care." },
    { name: "Dermatology", description: "Skin, hair, and nail disorders." },
    { name: "Neurology", description: "Brain and nervous system disorders." },
    { name: "Pediatrics", description: "Medical care for infants, children, and adolescents." },
    { name: "Orthopedics", description: "Musculoskeletal system disorders." },
    { name: "General Practice", description: "Primary healthcare and general medical services." }
  ];

  const createdSpecialties = [];
  for (const specialty of specialties) {
    const created = await prisma.specialty.create({
      data: specialty
    });
    createdSpecialties.push(created);
  }

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
          permissions: {
            create: createdPermissions.map(permission => ({
              permissionId: permission.id
            }))
          }
        }
      }
    }
  });

  // Create sample doctors
  const doctorsData = [
    {
      email: 'sarah.johnson@dfc.com',
      name: 'Dr. Sarah Johnson',
      phone: '+234 802 345 6789',
      license: 'MD-001-2024',
      experience: 10,
      consultationFee: 15000,
      bio: 'Experienced cardiologist with over 10 years of practice.',
      specialtyName: 'Cardiology'
    },
    {
      email: 'michael.brown@dfc.com', 
      name: 'Dr. Michael Brown',
      phone: '+234 803 456 7890',
      license: 'MD-002-2024',
      experience: 8,
      consultationFee: 12000,
      bio: 'Specialist in neurological disorders and brain health.',
      specialtyName: 'Neurology'
    },
    {
      email: 'emily.davis@dfc.com',
      name: 'Dr. Emily Davis', 
      phone: '+234 804 567 8901',
      license: 'MD-003-2024',
      experience: 12,
      consultationFee: 18000,
      bio: 'Pediatric specialist focusing on child healthcare.',
      specialtyName: 'Pediatrics'
    },
    {
      email: 'james.wilson@dfc.com',
      name: 'Dr. James Wilson',
      phone: '+234 805 678 9012', 
      license: 'MD-004-2024',
      experience: 15,
      consultationFee: 20000,
      bio: 'Orthopedic surgeon specializing in joint replacements.',
      specialtyName: 'Orthopedics'
    }
  ];

  const createdDoctors: Prisma.UserGetPayload<{ include: { doctorProfile: true } }>[] = [];
  for (const doctorData of doctorsData) {
    const specialty = createdSpecialties.find(s => s.name === doctorData.specialtyName);
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    
    const doctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        password: doctorPassword,
        name: doctorData.name,
        phone: doctorData.phone,
        role: UserRole.DFC_MEMBER,
        doctorProfile: {
          create: {
            slug: doctorData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            license: doctorData.license,
            experience: doctorData.experience,
            consultationFee: doctorData.consultationFee,
            bio: doctorData.bio,
            specialtyId: specialty?.id,
            country: ['United Kingdom', 'United States', 'Canada', 'Germany'][Math.floor(Math.random() * 4)]
          }
        }
      },
      include: { doctorProfile: true }
    });
    createdDoctors.push(doctor as any);
  }

  // Create sample patients
  const patientsData = [
    { email: 'john.doe@example.com', name: 'John Doe', phone: '+234 806 789 0123' },
    { email: 'jane.smith@example.com', name: 'Jane Smith', phone: '+234 807 890 1234' },
    { email: 'mike.wilson@example.com', name: 'Mike Wilson', phone: '+234 808 901 2345' },
    { email: 'sarah.davis@example.com', name: 'Sarah Davis', phone: '+234 809 012 3456' }
  ];

  const createdPatients: Prisma.UserGetPayload<{ include: { patientProfile: true } }>[] = [];
  for (const patientData of patientsData) {
    const patientPassword = await bcrypt.hash('patient123', 12);
    
    const patient = await prisma.user.upsert({
      where: { email: patientData.email },
      update: {},
      create: {
        email: patientData.email,
        password: patientPassword,
        name: patientData.name,
        phone: patientData.phone,
        role: UserRole.PATIENT,
        patientProfile: {
          create: {
            dateOfBirth: new Date('1990-05-15'),
            gender: 'male',
            address: '123 Main Street, Lagos, Nigeria',
            emergencyContact: '+234 804 567 8901',
            bloodGroup: 'O+'
          }
        }
      },
      include: { patientProfile: true }
    });
    createdPatients.push(patient as any);
  }

  // Create appointments
  for (let i = 0; i < 20; i++) {
    const patient = createdPatients[i % createdPatients.length];
    const doctor = createdDoctors[i % createdDoctors.length];
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + (i % 30) - 15); // Spread over past and future dates
    
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const status = statuses[i % statuses.length];
    
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate,
        startTime: `${9 + (i % 8)}:00`,
        endTime: `${9 + (i % 8)}:30`,
        status: status as any,
        reason: 'Regular checkup',
        consultationFee: Number(doctor.doctorProfile!.consultationFee)
      }
    });
  }

  // Create payments
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    take: 10,
    include: {
      patient: {
        include: {
          patientProfile: true
        }
      }
    }
  });

  for (const appointment of completedAppointments) {
    if (appointment.patient.patientProfile) {
      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patient.patientProfile.id,
          amount: Math.floor(appointment.consultationFee),
          paymentReference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
    }
  }

  // Create doctor ratings
  for (const doctor of createdDoctors) {
    for (let i = 0; i < 3; i++) {
      const patient = createdPatients[i];
      await prisma.doctorRating.upsert({
        where: {
          doctorId_patientId: {
            doctorId: doctor.doctorProfile!.id,
            patientId: patient.patientProfile!.id
          }
        },
        update: {},
        create: {
          doctorId: doctor.doctorProfile!.id,
          patientId: patient.patientProfile!.id,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          review: 'Excellent doctor! Very professional and caring.'
        }
      });
    }
  }

  console.log('✅ Database seeded successfully!');

  // Seed System Settings
  const defaultSettings = {
    general: {
      siteName: "DFC Medical Platform",
      siteDescription: "Professional medical consultation platform",
      contactEmail: "admin@dfcmedical.com",
      supportPhone: "+234 800 123 4567",
    },
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointments: true,
      payments: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: "Minimum 8 characters, include uppercase, lowercase, number and special character",
    },
    system: {
      maintenanceMode: false,
      registrationOpen: true,
      autoBackup: true,
      backupTime: "02:00",
    },
    payment: {
      currency: "NGN",
      consultationFee: 5000,
      platformFee: 10,
      paymentMethods: "Credit Card, Debit Card, Bank Transfer, Mobile Money",
      refundPolicy: "Full refund available up to 24 hours before appointment",
    },
    email: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUser: "noreply@dfcmedical.com",
      fromEmail: "DFC Medical <noreply@dfcmedical.com>",
      replyEmail: "support@dfcmedical.com",
      enableSSL: true,
    },
  };

  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: defaultSettings
    });
    console.log('✅ Created default system settings');
  }

  // Create test notification for superadmin
  await prisma.notification.create({
    data: {
      userId: superAdmin.id,
      title: 'Welcome to System Settings',
      message: 'You can now configure system settings and notifications.',
      type: 'info',
      link: '/admin/settings'
    }
  });
  console.log('✅ Created test notifications');
  console.log('\n📋 Test Accounts:');
  console.log('Super Admin: superadmin@dfc.com / superadmin123');
  console.log('Doctors: [doctor-email] / doctor123');
  console.log('Patients: [patient-email] / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });