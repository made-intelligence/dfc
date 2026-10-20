/**
 * Permissions the application checks by name (hasPermission / requirePermission).
 * Deleting or deactivating one would silently lock every admin out of that area,
 * so they can be described and recategorised but not removed.
 */
export const BUILT_IN_PERMISSIONS: ReadonlySet<string> = new Set([
  "manage_admins",
  "manage_permissions",
  "system_settings",
  "view_analytics",
]);
