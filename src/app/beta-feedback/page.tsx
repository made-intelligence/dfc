"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Palette,
  Zap,
  MoreHorizontal,
  Star,
  Send,
  CheckCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { value: "BUG", label: "Bug Report", icon: Bug, desc: "Something isn't working right" },
  { value: "FEATURE", label: "Feature Request", icon: Lightbulb, desc: "I'd love to see this added" },
  { value: "UX", label: "UX / Design", icon: Palette, desc: "Layout, navigation, or visuals" },
  { value: "PERFORMANCE", label: "Performance", icon: Zap, desc: "Slow loading or lag" },
  { value: "OTHER", label: "Other", icon: MoreHorizontal, desc: "General thoughts" },
];

const PAGES = [
  "Home / Landing",
  "Specialists Directory",
  "Doctor Profile / Booking",
  "Payment / Checkout",
  "Appointments",
  "Video Consultation Room",
  "Member Portal",
  "Admin Dashboard",
  "Second Opinion",
  "Registration / Login",
  "Profile / Settings",
  "Other",
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function BetaFeedbackPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Pre-fill from auth
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !category || !message) {
      addToast({ title: "Missing fields", description: "Please fill in all required fields.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, category, page, rating: rating || null, message }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        addToast({ title: "Error", description: data.error || "Failed to submit", type: "error" });
      }
    } catch {
      addToast({ title: "Error", description: "Something went wrong", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Topbar />
        <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-20 bg-gray-50">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0D1F3C] to-[#0A3454] px-6 py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Thank You!</h2>
                <p className="text-white/60 mt-1">Your feedback helps shape DFC</p>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-gray-600 text-center text-sm">
                  We review every submission. Your input directly influences what we build next.
                </p>
                <Button
                  className="w-full bg-[#0A6E75] hover:bg-[#085c62]"
                  onClick={() => {
                    setSubmitted(false);
                    setCategory("");
                    setPage("");
                    setRating(0);
                    setMessage("");
                    setCharCount(0);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit More Feedback
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
                  Back to Home
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const progress = [name, email, category, message].filter(Boolean).length;
  const progressPercent = (progress / 4) * 100;

  return (
    <>
      <Topbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#0A6E75]/10 text-[#0A6E75] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              Beta Testing Program
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] mb-3">
              Share Your Feedback
            </h1>
            <p className="text-gray-600 text-lg max-w-lg mx-auto">
              Help us build a better platform. Your insights as an early tester are invaluable.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>{progress}/4 required fields</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0A6E75] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">About You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base bg-white"
                >
                  <option value="">Select your role</option>
                  <option value="EXCO">EXCO Member</option>
                  <option value="BOT">Board of Trustees</option>
                  <option value="MEMBER">DFC Member</option>
                  <option value="PATIENT">Patient / Public User</option>
                  <option value="GUEST">Guest Tester</option>
                </select>
              </div>
            </div>

            {/* Category card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">What kind of feedback? *</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-[#0A6E75] bg-[#0A6E75]/5"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? "text-[#0A6E75]" : "text-gray-400"}`} />
                      <div>
                        <span className={`text-sm font-medium block ${isSelected ? "text-[#0A6E75]" : "text-gray-700"}`}>
                          {cat.label}
                        </span>
                        <span className="text-xs text-gray-400">{cat.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h3>

              {/* Page selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Which page or feature?</label>
                <select
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base bg-white"
                >
                  <option value="">Select a page (optional)</option>
                  {PAGES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Satisfaction</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200 hover:text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="ml-2 text-sm text-gray-500 font-medium">
                      {RATING_LABELS[hoverRating || rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Your Feedback *</label>
                  <span className={`text-xs ${charCount > 1000 ? "text-amber-500" : "text-gray-300"}`}>
                    {charCount > 0 ? `${charCount.toLocaleString()} chars` : ""}
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  placeholder={
                    category === "BUG"
                      ? "What happened? What did you expect? Steps to reproduce..."
                      : category === "FEATURE"
                      ? "What would you like to see? Why would it be useful?"
                      : category === "UX"
                      ? "What felt confusing or could look better?"
                      : category === "PERFORMANCE"
                      ? "What was slow? Which page or action?"
                      : "Share your thoughts, suggestions, or observations..."
                  }
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <Button
                type="submit"
                disabled={loading || !name || !email || !category || !message}
                className="w-full bg-[#0D1F3C] hover:bg-[#162d52] py-3 text-base disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Feedback
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3">
                Feedback is reviewed by the DFC development team only and kept confidential.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
