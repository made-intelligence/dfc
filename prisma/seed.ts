import { PrismaClient, UserRole, ConsultationMode, Prisma } from '@prisma/client';
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

  // Create sample doctors — Nigerian diaspora physicians
  // All doctors do video consults. Some also offer in-person sessions
  // when visiting Nigeria (at their own facility or a DFC partner centre).
  const doctorsData = [
    {
      email: 'amina.yusuf@dfc.com',
      name: 'Dr. Amina Yusuf',
      phone: '+44 7700 900123',
      license: 'GMC-7891234',
      experience: 14,
      consultationFee: 25000,
      bio: 'Consultant cardiologist at Royal London Hospital with subspecialty interest in heart failure and cardiac imaging. Fellow of the Royal College of Physicians.',
      specialtyName: 'Cardiology',
      country: 'United Kingdom',
      city: 'London',
      institution: 'Royal London Hospital',
      // Also sees patients in Lagos when visiting
      offersInPerson: true,
      inPersonLocation: 'DFC Partner Centre, Victoria Island, Lagos',
    },
    {
      email: 'obioma.uchenna@dfc.com',
      name: 'Dr. Obioma Uchenna',
      phone: '+1 212 555 0198',
      license: 'NY-MD-028451',
      experience: 10,
      consultationFee: 35000,
      bio: 'Board-certified neurologist specialising in movement disorders and epilepsy. Assistant Professor at Mount Sinai.',
      specialtyName: 'Neurology',
      country: 'United States',
      city: 'New York',
      institution: 'Mount Sinai Hospital',
      offersInPerson: false,
      inPersonLocation: null,
    },
    {
      email: 'ngozi.okafor@dfc.com',
      name: 'Dr. Ngozi Okafor',
      phone: '+1 416 555 0234',
      license: 'CPSO-109234',
      experience: 18,
      consultationFee: 20000,
      bio: 'Paediatric consultant with expertise in neonatal care and childhood respiratory conditions. Active in community child health outreach across the GTA.',
      specialtyName: 'Pediatrics',
      country: 'Canada',
      city: 'Toronto',
      institution: 'SickKids Hospital',
      // Visits Abuja quarterly
      offersInPerson: true,
      inPersonLocation: 'DFC Partner Centre, Wuse 2, Abuja',
    },
    {
      email: 'chukwudi.eze@dfc.com',
      name: 'Dr. Chukwudi Eze',
      phone: '+44 7700 900456',
      license: 'GMC-6523891',
      experience: 22,
      consultationFee: 30000,
      bio: 'Consultant orthopaedic surgeon with subspecialty in hip and knee arthroplasty. Over two decades of surgical experience at NHS trusts across England.',
      specialtyName: 'Orthopedics',
      country: 'United Kingdom',
      city: 'Manchester',
      institution: 'Manchester Royal Infirmary',
      // Has own consulting room in Lagos
      offersInPerson: true,
      inPersonLocation: 'Eze Orthopaedic Clinic, Lekki Phase 1, Lagos',
    },
    {
      email: 'folake.adeyemi@dfc.com',
      name: 'Dr. Folake Adeyemi',
      phone: '+49 176 555 0789',
      license: 'DE-BÄK-34521',
      experience: 9,
      consultationFee: 18000,
      bio: 'Dermatologist specialising in skin of colour, eczema management, and cosmetic dermatology. Practising in Berlin with a growing teledermatology practice.',
      specialtyName: 'Dermatology',
      country: 'Germany',
      city: 'Berlin',
      institution: 'Charité University Hospital',
      offersInPerson: false,
      inPersonLocation: null,
    },
    {
      email: 'emeka.nwosu@dfc.com',
      name: 'Dr. Emeka Nwosu',
      phone: '+44 7700 900321',
      license: 'GMC-8912345',
      experience: 16,
      consultationFee: 22000,
      bio: 'GP and family medicine specialist with a special interest in diabetes and cardiovascular risk management. NHS partner at a busy urban practice in Birmingham.',
      specialtyName: 'General Practice',
      country: 'United Kingdom',
      city: 'Birmingham',
      institution: 'Edgbaston Medical Centre',
      offersInPerson: false,
      inPersonLocation: null,
    },
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
            slug: doctorData.name.replace(/^Dr\.\s*/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
            license: doctorData.license,
            experience: doctorData.experience,
            consultationFee: doctorData.consultationFee,
            bio: doctorData.bio,
            specialtyId: specialty?.id,
            country: doctorData.country,
            city: doctorData.city,
            institution: doctorData.institution,
          }
        }
      },
      include: { doctorProfile: true }
    });
    createdDoctors.push(doctor as any);
  }

  // Create doctor schedules
  // Each session is a single mode — video OR in-person, never mixed in the same block.
  // But a doctor can have a video morning and in-person afternoon on the same day.
  console.log('📅 Creating doctor schedules...');
  for (let i = 0; i < doctorsData.length; i++) {
    const doctorData = doctorsData[i];
    const doctor = createdDoctors[i];
    const profileId = doctor.doctorProfile!.id;

    // Morning video sessions — Mon–Fri (all doctors)
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: profileId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '13:00',
          slotDuration: 30,
          scheduleType: 'AVAILABLE',
          isRecurring: true,
          consultationMode: ConsultationMode.VIDEO,
          location: null,
          title: 'Video Consultation',
        },
      });
    }

    if (doctorData.offersInPerson && doctorData.inPersonLocation) {
      // Afternoon in-person sessions — Thu + Sat (separate session, same or different day)
      for (const day of [4, 6]) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profileId,
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '18:00',
            slotDuration: 45,
            scheduleType: 'AVAILABLE',
            isRecurring: true,
            consultationMode: ConsultationMode.IN_PERSON,
            location: doctorData.inPersonLocation,
            title: 'In-Person Clinic (Nigeria)',
          },
        });
      }

      // Afternoon video on non-in-person days (Tue, Wed)
      for (const day of [2, 3]) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profileId,
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '17:00',
            slotDuration: 30,
            scheduleType: 'AVAILABLE',
            isRecurring: true,
            consultationMode: ConsultationMode.VIDEO,
            location: null,
            title: 'Afternoon Teleconsult',
          },
        });
      }
    } else {
      // Video-only doctors: afternoon video on Tue, Thu
      for (const day of [2, 4]) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profileId,
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '17:00',
            slotDuration: 30,
            scheduleType: 'AVAILABLE',
            isRecurring: true,
            consultationMode: ConsultationMode.VIDEO,
            location: null,
            title: 'Afternoon Teleconsult',
          },
        });
      }
    }
  }
  console.log('✅ Created doctor schedules...');

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

  // ─── Nigeria-Based Local Specialists (DFCMember + DoctorProfile) ───
  // These are Nigeria-based doctors in the local specialist network.
  // They appear on the /specialists page (not the /book diaspora directory).
  console.log('🇳🇬 Seeding Nigeria-based local specialists...');

  // Add more specialties needed for local specialists
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

  const localSpecialistsData = [
    {
      email: 'adaeze.nwachukwu@lagos-uth.gov.ng',
      name: 'Dr. Adaeze Nwachukwu',
      phone: '+234 803 456 7890',
      title: 'Dr.',
      license: 'MDCN-45672',
      experience: 20,
      bio: 'Consultant obstetrician and gynaecologist at Lagos University Teaching Hospital (LUTH). Subspecialty in high-risk pregnancies and gynaecological oncology. Past president of the Nigerian Society of Gynaecology.',
      specialtyName: 'Obstetrics & Gynaecology',
      subSpecialty: 'Gynaecological Oncology',
      country: 'Nigeria',
      city: 'Lagos',
      institution: 'Lagos University Teaching Hospital (LUTH)',
      consultationFee: 15000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/45672',
      acceptsReferrals: true,
    },
    {
      email: 'bayo.ogunlade@uch.edu.ng',
      name: 'Prof. Bayo Ogunlade',
      phone: '+234 806 789 0123',
      title: 'Prof.',
      license: 'MDCN-23891',
      experience: 28,
      bio: 'Professor of orthopaedic surgery at University College Hospital (UCH), Ibadan. Pioneer in minimally invasive joint replacement surgery in West Africa. Published over 60 peer-reviewed papers.',
      specialtyName: 'Orthopedics',
      subSpecialty: 'Joint Replacement Surgery',
      country: 'Nigeria',
      city: 'Ibadan',
      institution: 'University College Hospital (UCH)',
      consultationFee: 20000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/23891',
      acceptsReferrals: true,
    },
    {
      email: 'chidinma.obi@nha-abuja.gov.ng',
      name: 'Dr. Chidinma Obi',
      phone: '+234 809 123 4567',
      title: 'Dr.',
      license: 'MDCN-56123',
      experience: 12,
      bio: 'Consultant paediatrician at National Hospital Abuja with special interest in paediatric infectious diseases and immunology. WHO-trained in childhood vaccination programme development.',
      specialtyName: 'Pediatrics',
      subSpecialty: 'Paediatric Infectious Disease',
      country: 'Nigeria',
      city: 'Abuja',
      institution: 'National Hospital Abuja',
      consultationFee: 12000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/56123',
      acceptsReferrals: true,
    },
    {
      email: 'emeka.okoro@lasuth.gov.ng',
      name: 'Dr. Emeka Okoro',
      phone: '+234 802 345 6789',
      title: 'Dr.',
      license: 'MDCN-67234',
      experience: 15,
      bio: 'Consultant cardiologist and interventional specialist at Lagos State University Teaching Hospital (LASUTH). Trained at the National Heart Centre, Singapore. Performs coronary angiography and stenting.',
      specialtyName: 'Cardiology',
      subSpecialty: 'Interventional Cardiology',
      country: 'Nigeria',
      city: 'Lagos',
      institution: 'LASUTH Ikeja',
      consultationFee: 18000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/67234',
      acceptsReferrals: true,
    },
    {
      email: 'fatima.abdullahi@abuth.gov.ng',
      name: 'Dr. Fatima Abdullahi',
      phone: '+234 807 234 5678',
      title: 'Dr.',
      license: 'MDCN-78345',
      experience: 11,
      bio: 'Consultant psychiatrist at Ahmadu Bello University Teaching Hospital, Zaria. Specialises in adolescent mental health, PTSD, and culturally informed psychotherapy. Advocates for mental health destigmatisation in Northern Nigeria.',
      specialtyName: 'Psychiatry',
      subSpecialty: 'Adolescent Psychiatry',
      country: 'Nigeria',
      city: 'Zaria',
      institution: 'Ahmadu Bello University Teaching Hospital',
      consultationFee: 10000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/78345',
      acceptsReferrals: true,
    },
    {
      email: 'gbenga.afolabi@unilag.edu.ng',
      name: 'Dr. Gbenga Afolabi',
      phone: '+234 805 678 9012',
      title: 'Dr.',
      license: 'MDCN-89456',
      experience: 17,
      bio: 'Consultant ophthalmologist and vitreoretinal surgeon at the Eye Foundation Hospital, Lagos. Fellow of the West African College of Surgeons. Performed over 3,000 cataract surgeries.',
      specialtyName: 'Ophthalmology',
      subSpecialty: 'Vitreoretinal Surgery',
      country: 'Nigeria',
      city: 'Lagos',
      institution: 'Eye Foundation Hospital',
      consultationFee: 15000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/89456',
      acceptsReferrals: true,
    },
    {
      email: 'halima.yusuf@unimaid.edu.ng',
      name: 'Dr. Halima Yusuf',
      phone: '+234 808 567 8901',
      title: 'Dr.',
      license: 'MDCN-91234',
      experience: 14,
      bio: 'Consultant oncologist at the University of Maiduguri Teaching Hospital. Specialises in breast cancer and palliative care. Runs a community cancer screening programme in Borno State.',
      specialtyName: 'Oncology',
      subSpecialty: 'Breast Oncology',
      country: 'Nigeria',
      city: 'Maiduguri',
      institution: 'University of Maiduguri Teaching Hospital',
      consultationFee: 12000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/91234',
      acceptsReferrals: true,
    },
    {
      email: 'ikenna.eze@uniben.edu.ng',
      name: 'Dr. Ikenna Eze',
      phone: '+234 810 345 6789',
      title: 'Dr.',
      license: 'MDCN-34567',
      experience: 19,
      bio: 'Consultant urologist at the University of Benin Teaching Hospital (UBTH). Pioneer in laparoscopic urology in South-South Nigeria. Fellow of the International College of Surgeons.',
      specialtyName: 'Urology',
      subSpecialty: 'Laparoscopic Urology',
      country: 'Nigeria',
      city: 'Benin City',
      institution: 'University of Benin Teaching Hospital (UBTH)',
      consultationFee: 16000,
      path: 'local_specialist',
      mdcnNumber: 'MDCN/RN/34567',
      acceptsReferrals: true,
    },
  ];

  for (const spec of localSpecialistsData) {
    const specialty = createdSpecialties.find(s => s.name === spec.specialtyName);
    const password = await bcrypt.hash('specialist123', 12);
    const slug = spec.name.replace(/^(Dr\.|Prof\.)\s*/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

    const user = await prisma.user.create({
      data: {
        email: spec.email,
        password,
        name: spec.name,
        phone: spec.phone,
        role: UserRole.DFC_MEMBER,
        doctorProfile: {
          create: {
            slug,
            license: spec.license,
            experience: spec.experience,
            consultationFee: spec.consultationFee,
            bio: spec.bio,
            specialtyId: specialty?.id,
            country: spec.country,
            city: spec.city,
            institution: spec.institution,
            subSpecialty: spec.subSpecialty,
            title: spec.title,
            mdcnNumber: spec.mdcnNumber,
          },
        },
        dfcMember: {
          create: {
            category: 'MEMBER',
            status: 'ACTIVE',
            goodStanding: true,
            path: spec.path,
            acceptsReferrals: spec.acceptsReferrals,
            nigerianLicence: spec.mdcnNumber,
            institution: spec.institution,
            profileCompletionScore: 85,
            lastVerifiedAt: new Date(),
          },
        },
      },
    });

    // Create in-person schedule for local specialists (Mon-Fri mornings + afternoons)
    const profileId = (await prisma.doctorProfile.findUnique({ where: { userId: user.id } }))!.id;
    for (const day of [1, 2, 3, 4, 5]) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: profileId,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '13:00',
          slotDuration: 30,
          scheduleType: 'AVAILABLE',
          isRecurring: true,
          consultationMode: ConsultationMode.IN_PERSON,
          location: spec.institution + ', ' + spec.city,
          title: 'Morning Clinic',
        },
      });
      // Afternoon clinic Mon/Wed/Fri
      if (day === 1 || day === 3 || day === 5) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: profileId,
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '17:00',
            slotDuration: 30,
            scheduleType: 'AVAILABLE',
            isRecurring: true,
            consultationMode: ConsultationMode.IN_PERSON,
            location: spec.institution + ', ' + spec.city,
            title: 'Afternoon Clinic',
          },
        });
      }
    }
  }
  console.log('✅ Created 8 Nigeria-based local specialists with DFC membership');

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
  console.log('Doctors: amina.yusuf@dfc.com / doctor123 (+ 5 more)');
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