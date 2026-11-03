/**
 * Shared administrator helpers. Keep independent of route modules.
 */
export const SYSTEM_ADMIN_EMAIL = "caleb.zothansanga@gmail.com";

export function isSystemAdmin(user) {
  if (!user) return false;
  const email = typeof user.email === "string" ? user.email.toLowerCase() : "";
  const role = typeof user.role === "string" ? user.role.toLowerCase() : "";
  return email === SYSTEM_ADMIN_EMAIL.toLowerCase() ||
    ["system administrator", "admin", "coordinator"].includes(role);
}

export function isPlatformAdmin(user) {
  return isSystemAdmin(user) || Boolean(user?.isPublicModerator);
}
