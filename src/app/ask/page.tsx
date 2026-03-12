"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { SPECIALTIES } from "@/lib/specialties";

interface Question {
  id: string;
  slug?: string;
  title: string;
  questionBody: string;
  specialty: string | null;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  answerCount: number;
  viewCount: number;
  createdAt: string;
}

interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_TABS = ["All", "Open", "Answered"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function AskPage() {
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // List state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSpecialty) params.set("specialty", filterSpecialty);
      if (statusTab !== "All") params.set("status", statusTab.toUpperCase());
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("page", String(page));

      const res = await fetch(`/api/ask?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load questions");
      const data: QuestionsResponse = await res.json();
      setQuestions(data.questions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filterSpecialty, statusTab, debouncedSearch, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterSpecialty, statusTab, debouncedSearch]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questionBody, specialty: specialty || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit question");
      }

      setSubmitSuccess(true);
      setTitle("");
      setQuestionBody("");
      setSpecialty("");
      fetchQuestions();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-[#0D1F3C] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ask a DFC Specialist
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto" style={{ fontSize: "18px" }}>
            Get answers from verified diaspora physicians. Questions answered
            publicly help others too.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Ask a Question — collapsible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setFormOpen(!formOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            style={{ minHeight: "44px" }}
          >
            <span className="font-semibold text-[#0D1F3C]" style={{ fontSize: "18px" }}>
              Ask a Question
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${formOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {formOpen && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
              {submitSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3" style={{ fontSize: "16px" }}>
                  Your question has been submitted. Our specialists will respond shortly.
                </div>
              )}
              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3" style={{ fontSize: "16px" }}>
                  {submitError}
                </div>
              )}

              <div>
                <label htmlFor="ask-title" className="block font-medium text-gray-700 mb-1" style={{ fontSize: "16px" }}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="ask-title"
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your question"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent"
                  style={{ fontSize: "16px", minHeight: "44px" }}
                />
                <p className="text-sm text-gray-400 mt-1">{title.length}/200</p>
              </div>

              <div>
                <label htmlFor="ask-body" className="block font-medium text-gray-700 mb-1" style={{ fontSize: "16px" }}>
                  Your Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ask-body"
                  required
                  maxLength={5000}
                  rows={5}
                  value={questionBody}
                  onChange={(e) => setQuestionBody(e.target.value)}
                  placeholder="Describe your question in detail..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent resize-y"
                  style={{ fontSize: "16px" }}
                />
                <p className="text-sm text-gray-400 mt-1">{questionBody.length}/5000</p>
              </div>

              <div>
                <label htmlFor="ask-specialty" className="block font-medium text-gray-700 mb-1" style={{ fontSize: "16px" }}>
                  Specialty
                </label>
                <select
                  id="ask-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent bg-white"
                  style={{ fontSize: "16px", minHeight: "44px" }}
                >
                  <option value="">Select a specialty (optional)</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-lg bg-[#0D1F3C] text-white font-semibold px-8 py-3 hover:bg-[#162d54] focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: "16px", minHeight: "44px" }}
              >
                {submitting ? "Submitting..." : "Submit Question"}
              </button>
            </form>
          )}
        </div>

        {/* Filter bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent sm:w-64"
              style={{ fontSize: "16px", minHeight: "44px" }}
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D1F3C] focus:border-transparent"
              style={{ fontSize: "16px", minHeight: "44px" }}
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusTab(tab)}
                className={`rounded-md px-5 py-2 font-medium transition-colors ${
                  statusTab === tab
                    ? "bg-white text-[#0D1F3C] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontSize: "16px", minHeight: "44px" }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16 text-gray-400" style={{ fontSize: "16px" }}>
              Loading questions...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500" style={{ fontSize: "16px" }}>
                No questions found. Be the first to ask!
              </p>
            </div>
          ) : (
            questions.map((q) => (
              <a
                key={q.id}
                href={`/ask/${q.slug || q.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-6 py-5 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-[#0D1F3C] truncate"
                      style={{ fontSize: "18px" }}
                    >
                      {q.title}
                    </h3>
                    <p
                      className="mt-1 text-gray-600 line-clamp-2"
                      style={{ fontSize: "16px" }}
                    >
                      {q.questionBody.length > 200
                        ? q.questionBody.slice(0, 200) + "..."
                        : q.questionBody}
                    </p>
                  </div>
                  {q.specialty && (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-medium">
                      {q.specialty}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      q.status === "ANSWERED" ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        q.status === "ANSWERED" ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    {q.status === "ANSWERED" ? "Answered" : "Open"}
                  </span>
                  <span>{q.answerCount} {q.answerCount === 1 ? "answer" : "answers"}</span>
                  <span>{q.viewCount} {q.viewCount === 1 ? "view" : "views"}</span>
                  <span>{timeAgo(q.createdAt)}</span>
                </div>
              </a>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-gray-500" style={{ fontSize: "16px" }}>
              {total} question{total !== 1 && "s"} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: "16px", minHeight: "44px" }}
              >
                Previous
              </button>
              <span className="flex items-center px-3 text-gray-600" style={{ fontSize: "16px" }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ fontSize: "16px", minHeight: "44px" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
