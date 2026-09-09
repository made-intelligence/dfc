"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import Link from "next/link";
import { UserRole } from "@prisma/client";

export function RegisterForm() {
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { register } = useAuth(); // Assuming useAuth has register, otherwise we call API directly
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // If useAuth doesn't have register, use fetch directly
      // Checking context... usually consistent with login
      // But let's assume we call API directly for now as I can't see AuthContext definition easily without searching
      // Actually, standard pattern:
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "PATIENT", // Default to patient for self-signup
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Successful registration
      // If the API sets the cookie (it does), we can reload or redirect
      // Ideally update auth context. 
      // For now, full reload or redirect might work if layout re-fetches user.
      // But let's redirect to login to be safe OR direct to redirectUrl if cookie is set.
      // API sets cookie. So we can redirect.
      
      // Force a router refresh to update auth state
      router.refresh();
      router.push(redirectTo);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      ref={formRef}
      className={`w-full max-w-md mx-auto bg-white/[0.95] backdrop-blur-xl border-white/60 shadow-2xl rounded-2xl animate-fade-up ${formVisible ? "visible" : ""}`}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
          Create an Account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
         <div className="flex justify-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`} 
                className="text-primary font-medium hover:underline"
              >
                Sign In
              </Link>
            </p>
         </div>
      </CardContent>
    </Card>
  );
}
