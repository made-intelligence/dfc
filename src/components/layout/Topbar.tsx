"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, LogOut, Calendar, FileText, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from "./NotificationsDropdown";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Find a Specialist" },
  { href: "/second-opinion", label: "Second Opinion" },
  { href: "/specialists", label: "Nigeria Specialists" },
];

function getPortalUrl(role?: string): string {
  switch (role) {
    case "SUPERADMIN":
    case "SECRETARIAT":
      return "/admin";
    case "DFC_MEMBER":
      return "/member";
    case "HOSPITAL_ADMIN":
      return "/hospital";
    case "SPL_ADMIN":
      return "/spl";
    case "PATIENT":
      return "/appointments";
    default:
      return "/";
  }
}

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`${
        isScrolled || pathname !== "/"
          ? "fixed bg-white/95 backdrop-blur-md shadow-sm"
          : "absolute bg-white/85 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
      } inset-x-0 top-0 z-50 transition-all duration-300`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-18">
          <div className="flex shrink-0">
            <Link href="/" title="Home">
              <Image
                alt="Doctors Foundation for Care logo"
                src="/logo.png"
                width={160}
                height={60}
                className="h-24 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  className={`font-semibold text-sm transition-colors ${
                    isScrolled || pathname !== "/"
                      ? isActive
                        ? "text-[#0D1F3C]"
                        : "text-gray-700 hover:text-gray-900"
                      : isActive
                        ? "text-[#0D1F3C]"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 focus:outline-none">
                      <div className="w-10 h-10 bg-[#0D1F3C] rounded-full flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(getPortalUrl(user.role))}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>My Portal</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/book")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Find a Specialist</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/appointments")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>My Appointments</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-gray-700 hover:text-gray-900"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/join">
                  <Button
                    size="sm"
                    className="cursor-pointer bg-[#0D1F3C] hover:bg-[#162d52] text-white"
                  >
                    Join DFC
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="text-gray-900"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white rounded-lg shadow-lg mt-2 py-4 px-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="block font-medium text-gray-900 hover:text-[#0D1F3C] transition-colors"
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-200" />
            {user ? (
              <>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#0D1F3C] rounded-full flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <NotificationsDropdown />
                </div>
                <Link href={getPortalUrl(user.role)} onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    My Portal
                  </Button>
                </Link>
                <Link href="/book" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Find a Specialist
                  </Button>
                </Link>
                <Link href="/appointments" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    My Appointments
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/join" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full bg-[#0D1F3C] hover:bg-[#162d52] text-white">
                    Join DFC
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
