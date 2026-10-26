"use client";

import { useRouter } from "@/lib/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The signed-in user's name at the top right of a dashboard, opening Profile and Sign out. */
export function AccountMenu({
  name,
  email,
  subtitle,
  profileHref,
  profileLabel = "Profile",
  onSignOut,
}: {
  name: string;
  email: string;
  /** Shown above the menu items, e.g. the user's role. */
  subtitle?: string;
  profileHref: string;
  profileLabel?: string;
  onSignOut: () => void;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-md px-2 py-1 text-right text-sm leading-tight cursor-pointer hover:bg-gray-100"
        >
          <div className="min-w-0 max-w-[10rem] sm:max-w-xs">
            <div className="text-gray-900 font-medium truncate">{name}</div>
            <div className="text-gray-500 text-xs truncate">{email}</div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {subtitle && (
          <>
            <DropdownMenuLabel className="text-xs font-normal capitalize text-gray-500">{subtitle}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => router.push(profileHref)}>
          <User className="mr-2 h-4 w-4" />
          {profileLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut} className="text-red-700 focus:text-red-800">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
