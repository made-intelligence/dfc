import { UserRole } from "@prisma/client";

/**
 * Landing route for a signed-in user, by role.
 *
 * Shared so that sign-in and account activation cannot drift apart: the claim
 * page used to send every newly activated member to "/dashboard", a route that
 * does not exist, so setting a password ended on a 404 and looked like failure.
 * Mirrors ROLE_ROUTES in src/proxy.ts, which gates these same paths.
 */
export function getDashboardUrl(role?: UserRole | string | null): string {
  switch (role) {
    case UserRole.SUPERADMIN:
    case UserRole.SECRETARIAT:
      return "/admin";
    case UserRole.DFC_MEMBER:
      return "/member";
    case UserRole.HOSPITAL_ADMIN:
      return "/hospital";
    case UserRole.SPL_ADMIN:
      return "/spl";
    case UserRole.PATIENT:
      return "/appointments";
    default:
      return "/";
  }
}
