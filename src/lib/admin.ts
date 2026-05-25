// Admin check is done via checkAdminStatus() server action in app/actions/admin.ts.
// This client-side stub is only used to gate the admin UI while the async check loads.
export function isAdmin(_email: string | null | undefined): boolean {
  return false
}

