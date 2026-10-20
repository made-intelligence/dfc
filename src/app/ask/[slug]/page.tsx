"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams } from "@/lib/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, MessageSquare } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface QuestionDetail {
  id: string;
  slug: string | null;
  title: string;
  body: string;
  specialty: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  viewCount: number;
  createdAt: string;
}

interface Answer {
  id: string;
  body: string;
  isAccepted: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage: string | null;
    title?: string | null;
    slug?: string | null;
    specialty?: string | null;
  } | null;
}

const MIN_ANSWER = 50;
const MAX_ANSWER = 10000;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AskQuestionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchQuestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/ask/${encodeURIComponent(slug)}/answers`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  async function handleAnswer(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/ask/${encodeURIComponent(slug)}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerBody }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Your answer could not be posted");
      }
      setAnswerBody("");
      await fetchQuestion();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Your answer could not be posted");
    } finally {
      setSubmitting(false);
    }
  }

  const canAnswer = user?.role === "DFC_MEMBER" && question?.status !== "CLOSED";

  return (
    <>
      <Topbar />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-[#0D1F3C] text-white px-4 pt-32 pb-12 lg:pt-36">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/ask"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All questions
            </Link>
            {question && (
              <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
                {question.title}
              </h1>
            )}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          {loading ? (
            <p className="text-center py-16 text-gray-400">Loading question...</p>
          ) : notFound || !question ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
              <p className="text-gray-600">This question could not be found.</p>
              <Link href="/ask" className="mt-4 inline-block font-medium text-[#0A6E75] hover:underline">
                Browse other questions
              </Link>
            </div>
          ) : (
            <>
              {/* Question */}
              <article className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-[#0A6E75]/10 px-3 py-1 font-medium text-[#0A6E75]">
                    {question.specialty}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      question.status === "ANSWERED" ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        question.status === "ANSWERED" ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    {question.status === "ANSWERED"
                      ? "Answered"
                      : question.status === "CLOSED"
                        ? "Closed"
                        : "Open"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {question.viewCount} {question.viewCount === 1 ? "view" : "views"}
                  </span>
                  <span>Asked {formatDate(question.createdAt)}</span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                  {question.body}
                </p>
              </article>

              {/* Answers */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#0D1F3C]">
                  <MessageSquare className="h-5 w-5" />
                  {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
                </h2>
                {answers.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-gray-500">
                    No answers yet. A DFC specialist will respond soon.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {answers.map((a) => (
                      <article
                        key={a.id}
                        className={`rounded-xl border bg-white px-6 py-5 ${
                          a.isAccepted ? "border-green-300" : "border-gray-200"
                        }`}
                      >
                        {a.isAccepted && (
                          <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Accepted answer
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                          {a.body}
                        </p>
                        <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                          {a.author?.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.author.profileImage}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D1F3C] text-sm font-semibold text-white">
                              {(a.author?.name || "D").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-sm">
                            {a.author?.slug ? (
                              <Link
                                href={`/specialists/${a.author.slug}`}
                                className="font-medium text-[#0D1F3C] hover:underline"
                              >
                                {[a.author.title, a.author.name].filter(Boolean).join(" ")}
                              </Link>
                            ) : (
                              <p className="font-medium text-[#0D1F3C]">
                                {a.author
                                  ? [a.author.title, a.author.name].filter(Boolean).join(" ")
                                  : "DFC Specialist"}
                              </p>
                            )}
                            <p className="text-gray-500">
                              {a.author?.specialty ? `${a.author.specialty} · ` : ""}
                              {formatDate(a.createdAt)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Answer form (DFC members) */}
              {canAnswer ? (
                <form
                  onSubmit={handleAnswer}
                  className="space-y-3 rounded-xl border border-gray-200 bg-white px-6 py-5"
                >
                  <label htmlFor="answer" className="block font-semibold text-[#0D1F3C]">
                    Your answer
                  </label>
                  <textarea
                    id="answer"
                    rows={6}
                    required
                    minLength={MIN_ANSWER}
                    maxLength={MAX_ANSWER}
                    value={answerBody}
                    onChange={(e) => setAnswerBody(e.target.value)}
                    placeholder="Share your clinical perspective. Avoid giving a diagnosis without an examination."
                    className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0D1F3C]"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      {answerBody.length < MIN_ANSWER
                        ? `${MIN_ANSWER - answerBody.length} more characters needed`
                        : `${answerBody.length}/${MAX_ANSWER}`}
                    </span>
                  </div>
                  {submitError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || answerBody.trim().length < MIN_ANSWER}
                    className="min-h-11 rounded-lg bg-[#0D1F3C] px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[#162d52] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Posting..." : "Post answer"}
                  </button>
                </form>
              ) : (
                !user && (
                  <p className="text-center text-sm text-gray-500">
                    Are you a DFC member?{" "}
                    <Link
                      href={`/auth/login?redirect=/ask/${encodeURIComponent(slug)}`}
                      className="font-medium text-[#0A6E75] hover:underline"
                    >
                      Sign in to answer
                    </Link>
                  </p>
                )
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
