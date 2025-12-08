import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { clearEmailConfigCache } from "@/lib/email/transporter";

const prisma = new PrismaClient();

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
    passwordPolicy:
      "Minimum 8 characters, include uppercase, lowercase, number and special character",
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

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json(defaultSettings);
    }
    
    // Combine fetched settings with defaults to ensure all fields exist
    const mergedSettings = {
      general: settings.general || defaultSettings.general,
      notifications: settings.notifications || defaultSettings.notifications,
      security: settings.security || defaultSettings.security,
      system: settings.system || defaultSettings.system,
      payment: settings.payment || defaultSettings.payment,
      email: settings.email || defaultSettings.email,
    };

    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const newSettings = await request.json();
    
    // Check if settings exist
    const existing = await prisma.systemSettings.findFirst();
    
    let updated;
    if (existing) {
      updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          general: newSettings.general,
          notifications: newSettings.notifications,
          security: newSettings.security,
          system: newSettings.system,
          payment: newSettings.payment,
          email: newSettings.email,
        }
      });
    } else {
      updated = await prisma.systemSettings.create({
        data: {
          general: newSettings.general,
          notifications: newSettings.notifications,
          security: newSettings.security,
          system: newSettings.system,
          payment: newSettings.payment,
          email: newSettings.email,
        }
      });
    }

    // Clear email config cache to pick up new settings
    clearEmailConfigCache();

    return NextResponse.json({ message: "Settings updated successfully", settings: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}

