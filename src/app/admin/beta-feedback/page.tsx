"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  Eye,
  Archive,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from "lucide-react";

interface Feedback {
  id: string;
  name: string;
  email: string;
  role: string | null;
  category: string;
  page: string | null;
  rating: number | null;
  message: string;
  userAgent: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  user: { name: string; role: string; profileImage: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  NEW: { label: "New", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  REVIEWED: { label: "Reviewed", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Eye },
  RESOLVED: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  DEFERRED: { label: "Deferred", color: "bg-gray-50 text-gray-600 border-gray-200", icon: Archive },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  BUG: { label: "Bug", icon: Bug, color: "text-red-500" },
  FEATURE: { label: "Feature", icon: Lightbulb, color: "text-amber-500" },
  UX: { label: "UX", icon: Palette, color: "text-purple-500" },
  PERFORMANCE: { label: "Perf", icon: Zap, color: "text-blue-500" },
  OTHER: { label: "Other", icon: MoreHorizontal, color: "text-gray-500" },
};

export default function AdminBetaFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);

      const res = await fetch(`/api/admin/beta-feedback?${params}`);
      const data = await res.json();

      if (data.success) {
        setFeedback(data.feedback);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateFeedback = async (id: string, status?: string, adminNotes?: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/beta-feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      if (res.ok) {
        await fetchFeedback();
      }
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCount = Object.values(stats).reduce((a, b) => a + b, 0);
  const newCount = stats["NEW"] || 0;
  const reviewedCount = stats["REVIEWED"] || 0;
  const resolvedCount = stats["RESOLVED"] || 0;

  return (
    <DashboardLayout title="Beta Feedback">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0D1F3C]">Beta Feedback</h1>
            <p className="text-gray-500 mt-1">Review feedback from beta testers</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open("/beta-feedback", "_blank")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            View Feedback Form
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-[#0D1F3C]">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-4">
            <p className="text-sm text-blue-600">New</p>
            <p className="text-2xl font-bold text-blue-700">{newCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <p className="text-sm text-amber-600">Reviewed</p>
            <p className="text-2xl font-bold text-amber-700">{reviewedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-100 p-4">
            <p className="text-sm text-emerald-600">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700">{resolvedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !filterStatus ? "bg-[#0D1F3C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === key ? "bg-[#0D1F3C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(filterCategory === key ? "" : key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterCategory === key ? "bg-[#0D1F3C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${filterCategory === key ? "text-white" : config.color}`} />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0A6E75] animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => {
              const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER;
              const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.NEW;
              const CatIcon = catConfig.icon;
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <CatIcon className={`w-5 h-5 shrink-0 ${catConfig.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#0D1F3C] text-sm">{item.name}</span>
                        {item.role && (
                          <Badge variant="outline" className="text-xs">{item.role}</Badge>
                        )}
                        {item.page && (
                          <span className="text-xs text-gray-400">{item.page}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{item.message}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {item.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-medium text-gray-600">{item.rating}</span>
                        </div>
                      )}
                      <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400 block text-xs">Email</span>
                          <span className="text-gray-700">{item.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xs">Submitted</span>
                          <span className="text-gray-700">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-xs">Rating</span>
                          <div className="flex items-center gap-0.5">
                            {item.rating ? (
                              [...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < item.rating! ? "text-amber-400 fill-amber-400" : "text-gray-200"
                                  }`}
                                />
                              ))
                            ) : (
                              <span className="text-gray-400">Not rated</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400 text-xs block mb-1">Full Message</span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                          {item.message}
                        </p>
                      </div>

                      {/* Admin notes */}
                      <div>
                        <span className="text-gray-400 text-xs block mb-1">Admin Notes</span>
                        <textarea
                          value={notesInput[item.id] ?? item.adminNotes ?? ""}
                          onChange={(e) => setNotesInput({ ...notesInput, [item.id]: e.target.value })}
                          placeholder="Add internal notes..."
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none resize-none"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {item.status !== "REVIEWED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === item.id}
                            onClick={() => updateFeedback(item.id, "REVIEWED", notesInput[item.id])}
                          >
                            {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                            Mark Reviewed
                          </Button>
                        )}
                        {item.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={updatingId === item.id}
                            onClick={() => updateFeedback(item.id, "RESOLVED", notesInput[item.id])}
                          >
                            {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                            Resolve
                          </Button>
                        )}
                        {item.status !== "DEFERRED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === item.id}
                            onClick={() => updateFeedback(item.id, "DEFERRED", notesInput[item.id])}
                          >
                            <Archive className="w-3 h-3 mr-1" />
                            Defer
                          </Button>
                        )}
                        {notesInput[item.id] !== undefined && notesInput[item.id] !== (item.adminNotes ?? "") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === item.id}
                            onClick={() => updateFeedback(item.id, undefined, notesInput[item.id])}
                          >
                            Save Notes
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination info */}
        {total > 0 && (
          <p className="text-sm text-gray-400 text-center">
            Showing {feedback.length} of {total} feedback entries
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
