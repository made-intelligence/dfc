import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { headers } from "next/headers";

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "AUTH_FAILED"
  | "AUTH_PASSWORD_CHANGE"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_SUSPEND"
  | "PERMISSION_CHANGE"
  | "PAYMENT_INIT"
  | "PAYMENT_VERIFY"
  | "PAYMENT_REFUND"
  | "DATA_EXPORT"
  | "DATA_DOWNLOAD"
  | "CONSENT_GRANT"
  | "CONSENT_REVOKE"
  | "ADMIN_ACTION"
  | "EMR_ACCESS"
  | "EMR_UPDATE"
  | "SETTINGS_UPDATE"
  | "MEMBER_STATUS_CHANGE"
  | "SECOND_OPINION_CREATE"
  | "SECOND_OPINION_ASSIGN"
  | "FILE_UPLOAD"
  | "ACCOUNT_CREATE"
  | "ACCOUNT_CLAIM"
  | "PASSWORD_RESET_REQUEST"
  | "PROFILE_UPDATE"
  | "RECORD_SHARE"
  | "APPOINTMENT_BOOK"
  | "APPOINTMENT_CANCEL"
  | "APPOINTMENT_RESCHEDULE"
  | "APPOINTMENT_UPDATE"
  | "SCHEDULE_UPDATE"
  | "PRESCRIPTION_DISPENSE";

export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";

interface AuditEntry {
  userId?: string | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
}

/**
 * The caller's IP and browser. Without a request, reads the headers of the
 * request being handled (next/headers), so helpers called deep inside a route
 * (e.g. the EMR access check) still record them. Outside any request, such
 * as a background job, both are null.
 */
export async function clientInfo(
  request?: NextRequest
): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  let h: Headers | null = request?.headers ?? null;
  if (!h) {
    try {
      h = await headers();
    } catch {
      return { ipAddress: null, userAgent: null };
    }
  }
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null,
    userAgent: h.get("user-agent")?.slice(0, 500) || null,
  };
}

/**
 * Write an audit log entry. Fire-and-forget — never throws.
 */
export async function audit(
  entry: AuditEntry,
  request?: NextRequest
): Promise<void> {
  try {
    const { ipAddress, userAgent } = await clientInfo(request);

    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource ?? null,
        resourceId: entry.resourceId ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        severity: entry.severity ?? "INFO",
        ipAddress,
        userAgent,
      },
    });
  } catch {
    // Audit logging must never crash the request
    console.error("[AUDIT] Failed to write audit log:", entry.action);
  }
}

/**
 * Convenience wrappers for common audit events.
 */
export const auditAuth = {
  login: (userId: string, req?: NextRequest) =>
    audit({ userId, action: "AUTH_LOGIN", resource: "user", resourceId: userId }, req),

  loginFailed: (email: string, req?: NextRequest) =>
    audit({ action: "AUTH_FAILED", details: { email }, severity: "WARN" }, req),

  logout: (userId: string, req?: NextRequest) =>
    audit({ userId, action: "AUTH_LOGOUT", resource: "user", resourceId: userId }, req),

  passwordChange: (userId: string, req?: NextRequest) =>
    audit({ userId, action: "AUTH_PASSWORD_CHANGE", resource: "user", resourceId: userId, severity: "WARN" }, req),
};

export const auditAdmin = {
  userCreate: (adminId: string, targetUserId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId: adminId, action: "USER_CREATE", resource: "user", resourceId: targetUserId, details }, req),

  userUpdate: (adminId: string, targetUserId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId: adminId, action: "USER_UPDATE", resource: "user", resourceId: targetUserId, details }, req),

  userDelete: (adminId: string, targetUserId: string, req?: NextRequest) =>
    audit({ userId: adminId, action: "USER_DELETE", resource: "user", resourceId: targetUserId, severity: "CRITICAL" }, req),

  userSuspend: (adminId: string, targetUserId: string, req?: NextRequest) =>
    audit({ userId: adminId, action: "USER_SUSPEND", resource: "user", resourceId: targetUserId, severity: "WARN" }, req),

  permissionChange: (adminId: string, targetUserId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId: adminId, action: "PERMISSION_CHANGE", resource: "user", resourceId: targetUserId, details, severity: "WARN" }, req),

  settingsUpdate: (adminId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId: adminId, action: "SETTINGS_UPDATE", resource: "settings", details }, req),

  memberStatusChange: (adminId: string, memberId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId: adminId, action: "MEMBER_STATUS_CHANGE", resource: "member", resourceId: memberId, details }, req),
};

export const auditPayment = {
  initialize: (userId: string, paymentId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId, action: "PAYMENT_INIT", resource: "payment", resourceId: paymentId, details }, req),

  verify: (userId: string, paymentId: string, details: Record<string, unknown>, req?: NextRequest) =>
    audit({ userId, action: "PAYMENT_VERIFY", resource: "payment", resourceId: paymentId, details }, req),
};

export const auditData = {
  export: (userId: string, resourceType: string, resourceId: string, req?: NextRequest) =>
    audit({ userId, action: "DATA_EXPORT", resource: resourceType, resourceId, severity: "WARN" }, req),

  download: (userId: string, resourceType: string, resourceId: string, req?: NextRequest) =>
    audit({ userId, action: "DATA_DOWNLOAD", resource: resourceType, resourceId }, req),
};

type Details = Record<string, unknown>;

/** Patient consent and record sharing. Changes who may see clinical data. */
export const auditConsent = {
  grant: (userId: string, resource: string, resourceId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "CONSENT_GRANT", resource, resourceId, details, severity: "WARN" }, req),

  revoke: (userId: string, resource: string, resourceId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "CONSENT_REVOKE", resource, resourceId, details, severity: "WARN" }, req),

  share: (userId: string, resource: string, resourceId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "RECORD_SHARE", resource, resourceId, details, severity: "WARN" }, req),
};

/** Sign-up, account claims and password resets: the account-takeover surface. */
export const auditAccount = {
  create: (userId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "ACCOUNT_CREATE", resource: "user", resourceId: userId, details }, req),

  claim: (userId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "ACCOUNT_CLAIM", resource: "user", resourceId: userId, details, severity: "WARN" }, req),

  /** userId is null when the email matched no account; the attempt is still worth seeing. */
  passwordResetRequest: (userId: string | null, details: Details, req?: NextRequest) =>
    audit({ userId, action: "PASSWORD_RESET_REQUEST", resource: "user", resourceId: userId ?? undefined, details, severity: "WARN" }, req),

  profileUpdate: (userId: string, resource: string, resourceId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "PROFILE_UPDATE", resource, resourceId, details }, req),
};

/** Appointment lifecycle, whoever acts (patient, doctor or secretariat). */
export const auditAppointment = {
  book: (userId: string | null, appointmentId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "APPOINTMENT_BOOK", resource: "appointment", resourceId: appointmentId, details }, req),

  cancel: (userId: string, appointmentId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "APPOINTMENT_CANCEL", resource: "appointment", resourceId: appointmentId, details }, req),

  reschedule: (userId: string, appointmentId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "APPOINTMENT_RESCHEDULE", resource: "appointment", resourceId: appointmentId, details }, req),

  update: (userId: string, appointmentId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "APPOINTMENT_UPDATE", resource: "appointment", resourceId: appointmentId, details }, req),

  /** A doctor's availability or fee; resourceId is the doctor's user id. */
  schedule: (userId: string, doctorUserId: string, details: Details, req?: NextRequest) =>
    audit({ userId, action: "SCHEDULE_UPDATE", resource: "doctor_schedule", resourceId: doctorUserId, details }, req),
};

/**
 * Any other change an admin makes. `resource` names the record type (e.g.
 * "committee"), and details.change says what happened (e.g. "create").
 */
export function auditAdminChange(
  userId: string | null,
  resource: string,
  resourceId: string | undefined,
  details: Details,
  req?: NextRequest,
  severity: AuditSeverity = "INFO",
) {
  return audit({ userId, action: "ADMIN_ACTION", resource, resourceId, details, severity }, req);
}
