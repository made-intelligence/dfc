import "server-only";
import { NextRequest } from "next/server";
import { getTokenFromCookies, verifyToken } from "@/lib/auth";
import { audit, type AuditAction, type AuditSeverity } from "@/lib/audit";

const CHANGE_BY_METHOD: Record<string, string> = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

/**
 * Wraps a route handler so every change it makes is in the audit log, for
 * routes with no more specific audit call. Records who acted, the method and
 * path, the record id (route param, ?id=, or the id in the response) and the
 * names of the fields sent, never their values. A 403 is logged as a warning:
 * someone tried something they are not allowed to do.
 *
 *   export const POST = withAudit("committee", handlePost);
 */
export function withAudit<Ctx>(
  resource: string,
  handler: (request: NextRequest, ctx: Ctx) => Promise<Response>,
  options: { action?: AuditAction; severity?: AuditSeverity } = {},
) {
  return async (request: NextRequest, ctx: Ctx): Promise<Response> => {
    const body = request.clone();
    const response = await handler(request, ctx);
    if (!response.ok && response.status !== 403) return response;

    try {
      const token = getTokenFromCookies(request.headers.get("cookie"));
      const actor = token ? await verifyToken(token) : null;
      const url = new URL(request.url);
      const params = await routeParams(ctx);

      let fields: string[] | undefined;
      if (request.headers.get("content-type")?.includes("application/json")) {
        const json = await body.json().catch(() => null);
        if (json && typeof json === "object" && !Array.isArray(json)) fields = Object.keys(json);
      }

      let resourceId = params?.id ?? url.searchParams.get("id") ?? undefined;
      if (!resourceId && response.ok && request.method === "POST") {
        const created = await response.clone().json().catch(() => null);
        if (created && typeof created.id === "string") resourceId = created.id;
      }

      await audit(
        {
          userId: actor?.userId ?? null,
          action: options.action ?? "ADMIN_ACTION",
          resource,
          resourceId,
          details: {
            change: CHANGE_BY_METHOD[request.method] ?? request.method.toLowerCase(),
            path: url.pathname,
            ...(params && Object.keys(params).length > 0 ? { params } : {}),
            ...(fields ? { fields } : {}),
            ...(response.ok ? {} : { outcome: "forbidden", status: response.status }),
          },
          severity: response.ok ? (options.severity ?? "INFO") : "WARN",
        },
        request,
      );
    } catch {
      // Auditing must never change the response.
    }
    return response;
  };
}

async function routeParams(ctx: unknown): Promise<Record<string, string> | undefined> {
  const params = (ctx as { params?: unknown } | undefined)?.params;
  if (!params) return undefined;
  return (await params) as Record<string, string>;
}
