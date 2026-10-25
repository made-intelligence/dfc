import { NextRequest, NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, isAuthError } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";
import { logger } from "@/lib/logger";
import { watMidnight } from "@/lib/wat";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The audit log (lib/audit) for super admins. It covers every admin's actions,
 * so the secretariat cannot read it.
 *
 * Filters: action, resource, severity, userId (who acted), resourceId, search
 * (the actor's name or email), from / to (YYYY-MM-DD, WAT days, inclusive).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (isAuthError(auth)) return auth;
    if (auth.role !== UserRole.SUPERADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams, { limit: 50 });
    const param = (name: string) => searchParams.get(name)?.trim() || undefined;

    const where: Prisma.AuditLogWhereInput = {
      action: param("action"),
      resource: param("resource"),
      severity: param("severity"),
      userId: param("userId"),
      resourceId: param("resourceId"),
    };

    const from = param("from");
    const to = param("to");
    if ((from && DATE_RE.test(from)) || (to && DATE_RE.test(to))) {
      where.createdAt = {
        ...(from && DATE_RE.test(from) ? { gte: watMidnight(from) } : {}),
        ...(to && DATE_RE.test(to) ? { lt: new Date(watMidnight(to).getTime() + DAY_MS) } : {}),
      };
    }

    // AuditLog.userId has no relation, so match the actor by name/email first.
    const search = param("search");
    if (search) {
      const actors = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true },
        take: 200,
      });
      where.userId = { in: actors.map((a) => a.id) };
    }

    const [logs, total, actions, resources] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
      prisma.auditLog.findMany({
        where: { resource: { not: null } },
        distinct: ["resource"],
        select: { resource: true },
        orderBy: { resource: "asc" },
      }),
    ]);

    const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => !!id))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];
    const usersById = new Map(users.map((u) => [u.id, u]));

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        severity: l.severity,
        details: l.details,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        actor: l.userId
          ? usersById.get(l.userId) ?? { id: l.userId, name: "Deleted user", email: null, role: null }
          : null,
      })),
      filters: {
        actions: actions.map((a) => a.action),
        resources: resources.map((r) => r.resource as string),
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("AdminAuditLogs", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
