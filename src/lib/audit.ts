import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

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
  | "FILE_UPLOAD";

export type AuditSeverity = "INFO" | "WARN" | "CRITICAL";

interface AuditEntry {
  userId?: string | null;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
}

function extractClientInfo(request?: NextRequest) {
  if (!request) return { ipAddress: null, userAgent: null };
  return {
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
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
    const { ipAddress, userAgent } = extractClientInfo(request);

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
