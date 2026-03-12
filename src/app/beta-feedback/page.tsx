"use client";

import { useState } from "react";
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
} from "lucide-react";

const CATEGORIES = [
  { value: "BUG", label: "Bug Report", icon: Bug, color: "text-red-500 bg-red-50 border-red-200" },
  { value: "FEATURE", label: "Feature Request", icon: Lightbulb, color: "text-amber-500 bg-amber-50 border-amber-200" },
  { value: "UX", label: "UX / Design", icon: Palette, color: "text-purple-500 bg-purple-50 border-purple-200" },
  { value: "PERFORMANCE", label: "Performance", icon: Zap, color: "text-blue-500 bg-blue-50 border-blue-200" },
  { value: "OTHER", label: "Other", icon: MoreHorizontal, color: "text-gray-500 bg-gray-50 border-gray-200" },
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

export default function BetaFeedbackPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center p-4 pt-24 pb-20">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-[#0D1F3C] mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your feedback has been submitted. It will help us improve the platform before launch.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full bg-[#0D1F3C] hover:bg-[#162d52]"
                  onClick={() => {
                    setSubmitted(false);
                    setCategory("");
                    setPage("");
                    setRating(0);
                    setMessage("");
                  }}
                >
                  Submit More Feedback
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = "/"}>
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#0A6E75]/10 text-[#0A6E75] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              Beta Testing
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] mb-3">
              Share Your Feedback
            </h1>
            <p className="text-gray-600 text-lg max-w-lg mx-auto">
              Help us build a better platform. Your insights as an early tester are invaluable.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Identity section */}
            <div className="p-6 space-y-4 border-b border-gray-100">
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

            {/* Category selection */}
            <div className="p-6 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">Feedback Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-[#0A6E75] bg-[#0A6E75]/5 text-[#0A6E75]"
                          : `border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50`
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-[#0A6E75]" : ""}`} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Page and rating */}
            <div className="p-6 border-b border-gray-100 space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Satisfaction</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Feedback *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === "BUG"
                      ? "Describe the bug: what happened, what you expected, and steps to reproduce..."
                      : category === "FEATURE"
                      ? "Describe the feature you'd like to see and why it would be useful..."
                      : "Share your thoughts, suggestions, or observations..."
                  }
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A6E75]/20 focus:border-[#0A6E75] outline-none text-base resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !name || !email || !category || !message}
                className="w-full bg-[#0D1F3C] hover:bg-[#162d52] py-3 text-base"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Feedback
              </Button>

              <p className="text-xs text-gray-400 text-center">
                Feedback is shared with the DFC development team only.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
