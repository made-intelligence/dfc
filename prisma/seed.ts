import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean all data — CASCADE handles FK dependencies
  const tableNames = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  for (const { tablename } of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
  
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

  // Reference specialties used across the local specialist network.
  const additionalSpecialties = [
    { name: "Obstetrics & Gynaecology", description: "Women's reproductive health, pregnancy, and childbirth." },
    { name: "Ophthalmology", description: "Eye and vision care, surgical and medical treatment." },
    { name: "Psychiatry", description: "Mental health diagnosis, treatment, and prevention." },
    { name: "Radiology", description: "Medical imaging and diagnostic interpretation." },
    { name: "Oncology", description: "Cancer diagnosis, treatment, and management." },
    { name: "Urology", description: "Urinary tract and male reproductive system disorders." },
  ];

  for (const specialty of additionalSpecialties) {
    const created = await prisma.specialty.create({ data: specialty });
    createdSpecialties.push(created);
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
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });