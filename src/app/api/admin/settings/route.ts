import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clearEmailConfigCache } from "@/lib/email/transporter";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { auditAdmin } from "@/lib/audit";
import { encrypt, decrypt, isEncrypted } from "@/lib/encryption";
import { activeEmailTransport } from "@/lib/email/service";
import { UserRole } from "@prisma/client";

type EmailSettings = Record<string, unknown> & { smtpPassword?: string };

/**
 * The SMTP password is encrypted at rest. Superadmins get it back decrypted
 * so the settings screen can reveal it; other admin roles (Secretariat) only
 * learn whether one is stored.
 */
function emailForClient(email: unknown, canSeePassword: boolean) {
  const { smtpPassword, ...rest } = (email || {}) as EmailSettings;
  const hasSmtpPassword = Boolean(smtpPassword);
  if (!canSeePassword || !smtpPassword) return { ...rest, hasSmtpPassword };

  let plain = smtpPassword;
  if (isEncrypted(smtpPassword)) {
    try {
      plain = decrypt(smtpPassword);
    } catch {
      // Encrypted under a different key; it can't be shown or used.
      plain = "";
    }
  }
  return { ...rest, hasSmtpPassword, smtpPassword: plain };
}

/**
 * A typed password is encrypted before saving. A superadmin sees the stored
 * password in the field, so a blank from them means "remove it"; other roles
 * never see it, so a blank from them keeps what is stored.
 */
function prepareEmailForSave(
  incoming: unknown,
  existing: unknown,
  canSeePassword: boolean,
): Prisma.InputJsonValue | undefined {
  if (!incoming || typeof incoming !== "object") return undefined;

  const { smtpPassword, ...fields } =
    incoming as EmailSettings & { hasSmtpPassword?: boolean };
  // hasSmtpPassword is a read-only flag from GET; it is not stored.
  delete fields.hasSmtpPassword;
  const rest = fields as Prisma.InputJsonObject;
  const typed = (smtpPassword || "").trim();
  const stored = ((existing || {}) as EmailSettings).smtpPassword;

  if (typed) return { ...rest, smtpPassword: encrypt(typed) };
  if (stored && !canSeePassword) {
    return { ...rest, smtpPassword: isEncrypted(stored) ? stored : encrypt(stored) };
  }
  return rest;
}


const defaultSettings = {
  general: {
    siteName: "Doctors Foundation for Care",
    siteDescription: "Connecting Nigerian patients with diaspora specialists",
    contactEmail: "info@doctorsfoundationforcare.org",
    supportPhone: "",
  },
  notifications: {
    email: true,
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
    smtpUser: "noreply@dfcare.org",
    fromEmail: "Doctors Foundation for Care <noreply@dfcare.org>",
    replyEmail: "info@doctorsfoundationforcare.org",
    enableSSL: true,
  },
};

// SMS notifications were removed; drop the old toggle from stored settings.
function withoutSms<T>(notifications: T): T {
  if (!notifications || typeof notifications !== "object") return notifications;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sms: _sms, ...rest } = notifications as Record<string, unknown>;
  return rest as T;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;
    const isSuperadmin = auth.role === UserRole.SUPERADMIN;

    const settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json({
        ...defaultSettings,
        email: emailForClient(defaultSettings.email, isSuperadmin),
        emailTransport: activeEmailTransport(),
      });
    }
    
    // Combine fetched settings with defaults to ensure all fields exist
    const mergedSettings = {
      general: settings.general || defaultSettings.general,
      notifications: withoutSms(settings.notifications) || defaultSettings.notifications,
      security: settings.security || defaultSettings.security,
      system: settings.system || defaultSettings.system,
      payment: settings.payment || defaultSettings.payment,
      email: emailForClient(settings.email || defaultSettings.email, isSuperadmin),
      emailTransport: activeEmailTransport(),
    };

    return NextResponse.json(mergedSettings);
  } catch (error) {
    logger.error('AdminSettings', error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;
    const isSuperadmin = auth.role === UserRole.SUPERADMIN;

    const newSettings = await request.json();
    
    // Check if settings exist
    const existing = await prisma.systemSettings.findFirst();
    const emailToSave = prepareEmailForSave(newSettings.email, existing?.email, isSuperadmin);
    
    let updated;
    if (existing) {
      updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          general: newSettings.general,
          notifications: withoutSms(newSettings.notifications),
          security: newSettings.security,
          system: newSettings.system,
          payment: newSettings.payment,
          email: emailToSave,
        }
      });
    } else {
      updated = await prisma.systemSettings.create({
        data: {
          general: newSettings.general,
          notifications: withoutSms(newSettings.notifications),
          security: newSettings.security,
          system: newSettings.system,
          payment: newSettings.payment,
          email: emailToSave,
        }
      });
    }

    // Clear email config cache to pick up new settings
    clearEmailConfigCache();

    // Audit settings update
    auditAdmin.settingsUpdate(auth.userId, {
      sections: Object.keys(newSettings),
    }, request);

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: { ...updated, email: emailForClient(updated.email, isSuperadmin) },
    });
  } catch (error) {
    logger.error('AdminSettings', error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}

