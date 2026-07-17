export type UserRole = "admin" | "expert";

const ROLE_STORAGE_KEY = "aura-user-role";

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return stored === "expert" ? "expert" : stored === "admin" ? "admin" : null;
}

export function setStoredRole(role: UserRole) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function clearStoredRole() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ROLE_STORAGE_KEY);
}

export function isAdminRole(role?: UserRole | null) {
  return role === "admin" || (role === undefined && getStoredRole() === "admin");
}
