// Placeholder auth for v1: effective-happiness has no admin roles/scopes today
// (IdentityServer only supports customer OTP login), so this is a hardcoded
// local gate rather than a real IdentityServer integration. Swap this out once
// the backend has real admin accounts.

const SESSION_KEY = 'admin.session'
const ADMIN_USERNAME = 'ops'
const ADMIN_PASSWORD = 'mtaapal-admin'

interface AdminSession {
  name: string
  loggedInAt: string
}

export function login(username: string, password: string): boolean {
  if (username.trim().toLowerCase() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return false
  }
  const session: AdminSession = { name: username.trim(), loggedInAt: new Date().toISOString() }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return true
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getAdminUser(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminSession
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getAdminUser() !== null
}
