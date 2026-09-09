"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@prisma/client";
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
import { useToast } from "@/components/ui/toast";

export function LoginForm() {
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Login without role filter - accept any valid user credentials
    const result = await login(email, password);

    if (result.success && result.user) {
      // Redirect based on the user's actual role from the backend
      addToast({
        title: "Login Successful",
        description: `Welcome back, ${result.user.name || result.user.email}!`,
        type: "success",
      });

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        const dashboardUrl = getDashboardUrl(result.user.role);
        router.push(dashboardUrl);
      }
    } else {
      setError(result.error || "Login failed");
      addToast({
        title: "Login Failed",
        description: result.error || "Please check your credentials",
        type: "error",
      });
    }

    setLoading(false);
  };

  const getDashboardUrl = (userRole?: UserRole) => {
    if (!userRole) return "/";

    switch (userRole) {
      case UserRole.SUPERADMIN:
        return "/admin";
      case UserRole.SECRETARIAT:
        return "/admin";
      case UserRole.DFC_MEMBER:
        return "/member";
      case UserRole.HOSPITAL_ADMIN:
        return "/hospital";
      case UserRole.PATIENT:
        return "/appointments";
      default:
        return "/";
    }
  };

  return (
    <Card
      ref={formRef}
      className={`w-full max-w-md mx-auto bg-white/[0.95] backdrop-blur-xl border-white/60 shadow-2xl rounded-2xl animate-fade-up ${formVisible ? "visible" : ""}`}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-[#0D1F3C]">
          Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
         <div className="flex flex-col items-center space-y-2 pt-4">
            <div className="flex justify-between w-full">
               <p className="text-sm text-primary font-medium">
                 <Link href="/">Back to Home</Link>
               </p>
               <p className="text-sm text-red-700 font-medium">
                 <Link href="/auth/forgot-password">Forgot Password?</Link>
               </p>
            </div>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link 
                href={`/auth/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="text-primary font-medium hover:underline"
              >
                Sign Up
              </Link>
            </p>
         </div>
      </CardContent>
    </Card>
  );
}
