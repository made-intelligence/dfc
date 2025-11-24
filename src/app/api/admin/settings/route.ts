import { NextRequest, NextResponse } from 'next/server';

const defaultSettings = {
  general: {
    siteName: 'DFC Medical Platform',
    siteDescription: 'Professional medical consultation platform',
    contactEmail: 'admin@dfcmedical.com',
    supportPhone: '+234 800 123 4567'
  },
  notifications: {
    email: true,
    sms: false,
    push: true,
    appointments: true,
    payments: true
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: 'Minimum 8 characters, include uppercase, lowercase, number and special character'
  },
  system: {
    maintenanceMode: false,
    registrationOpen: true,
    autoBackup: true,
    backupTime: '02:00'
  },
  payment: {
    currency: 'NGN',
    consultationFee: 5000,
    platformFee: 10,
    paymentMethods: 'Credit Card, Debit Card, Bank Transfer, Mobile Money',
    refundPolicy: 'Full refund available up to 24 hours before appointment'
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@dfcmedical.com',
    fromEmail: 'DFC Medical <noreply@dfcmedical.com>',
    replyEmail: 'support@dfcmedical.com',
    enableSSL: true
  }
};

export async function GET() {
  try {
    return NextResponse.json(defaultSettings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json();
    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}