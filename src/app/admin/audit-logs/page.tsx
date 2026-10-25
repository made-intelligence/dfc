"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading";
import { FilterChips, ListPager } from "@/components/admin/ListControls";
import { formatInstantWat } from "@/lib/wat";

interface AuditLogEntry {
  id: string;
  createdAt: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  severity: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  actor: { id: string; name: string; email: string | null; role: string | null } | null;
}

type Severity = "" | "INFO" | "WARN" | "CRITICAL";

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "", label: "All" },
  { value: "INFO", label: "Info" },
  { value: "WARN", label: "Warning" },
  { value: "CRITICAL", label: "Critical" },
];

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "bg-gray-100 text-gray-700",
  WARN: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 50;
const selectClass = "rounded-lg border border-gray-200 px-3 py-2 text-sm";

/** "ADMIN_ACTION" -> "Admin action", "doctor_schedule" -> "Doctor schedule" */
const humanize = (s: string) => {
  const words = s.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [severity, setSeverity] = useState<Severity>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Links can pre-filter, e.g. /admin/audit-logs?resource=doctor_schedule&resourceId=<id>.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResource(params.get("resource") || "");
    setResourceId(params.get("resourceId") || "");
    setAction(params.get("action") || "");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, action, resource, resourceId, severity, from, to]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (action) params.set("action", action);
      if (resource) params.set("resource", resource);
      if (resourceId) params.set("resourceId", resourceId);
      if (severity) params.set("severity", severity);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setActions(data.filters?.actions ?? []);
      setResources(data.filters?.resources ?? []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, action, resource, resourceId, severity, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = !!(search || action || resource || resourceId || severity || from || to);
  const clearFilters = () => {
    setSearch("");
    setAction("");
    setResource("");
    setResourceId("");
    setSeverity("");
    setFrom("");
    setTo("");
  };

  if (forbidden) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-xl font-semibold text-[#0D1F3C]">Audit log</h1>
        <p className="mt-2 text-sm text-gray-500">Only super admins can view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1F3C]">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          A record of sign-ins, admin actions, payments and data access across the platform. Times are WAT.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <CardTitle>Events</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by who acted..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 sm:w-64"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className={selectClass} value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="">All actions</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {humanize(a)}
                  </option>
                ))}
              </select>
              <select className={selectClass} value={resource} onChange={(e) => setResource(e.target.value)}>
                <option value="">All resources</option>
                {resources.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                From
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              </label>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                To
                <Input
                  type="date"
                  min={from || undefined}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-40"
                />
              </label>
              {filtered && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
            <FilterChips options={SEVERITY_OPTIONS} value={severity} onChange={setSeverity} />
            {resourceId && (
              <p className="text-sm text-gray-600">
                Showing events for <span className="font-mono">{resourceId}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No events match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="w-6 py-2" />
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Who</th>
                    <th className="py-2 pr-4 font-medium">Action</th>
                    <th className="py-2 pr-4 font-medium">Resource</th>
                    <th className="py-2 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const open = expanded === log.id;
                    const change = typeof log.details?.change === "string" ? log.details.change : null;
                    return (
                      <Fragment key={log.id}>
                        <tr
                          className="cursor-pointer border-b hover:bg-gray-50"
                          onClick={() => setExpanded(open ? null : log.id)}
                        >
                          <td className="py-2 text-gray-400">
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </td>
                          <td className="whitespace-nowrap py-2 pr-4">{formatInstantWat(log.createdAt)}</td>
                          <td className="py-2 pr-4">
                            {log.actor ? (
                              <>
                                <div className="font-medium">{log.actor.name}</div>
                                <div className="text-xs text-gray-500">
                                  {log.actor.email}
                                  {log.actor.role && ` · ${humanize(log.actor.role)}`}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">System / anonymous</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {humanize(log.action)}
                            {change && <span className="text-gray-500"> · {change}</span>}
                          </td>
                          <td className="py-2 pr-4">
                            {log.resource ? humanize(log.resource) : "—"}
                          </td>
                          <td className="py-2">
                            <Badge className={SEVERITY_STYLES[log.severity] ?? SEVERITY_STYLES.INFO}>
                              {humanize(log.severity)}
                            </Badge>
                          </td>
                        </tr>
                        {open && (
                          <tr className="border-b bg-gray-50">
                            <td />
                            <td colSpan={5} className="space-y-2 py-3 pr-4">
                              {log.resourceId && (
                                <p>
                                  <span className="text-gray-500">Resource ID: </span>
                                  <button
                                    type="button"
                                    className="font-mono text-[#0A6E75] hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResource(log.resource || "");
                                      setResourceId(log.resourceId || "");
                                    }}
                                    title="Show all events for this resource"
                                  >
                                    {log.resourceId}
                                  </button>
                                </p>
                              )}
                              {log.ipAddress && (
                                <p>
                                  <span className="text-gray-500">IP: </span>
                                  {log.ipAddress}
                                </p>
                              )}
                              {log.userAgent && (
                                <p className="break-all text-xs text-gray-500">{log.userAgent}</p>
                              )}
                              {log.details && (
                                <pre className="overflow-x-auto rounded-md bg-white p-3 text-xs">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && (
            <ListPager
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              totalPages={totalPages}
              noun="event"
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
