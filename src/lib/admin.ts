import { checkAdminStatus } from '@/app/actions/admin'

export const ADMIN_EMAILS = [
  'admin@penlibrary.com',
  'hosannabala4u@gmail.com' 
]

// This function is now async because it checks the DB
// However, many client components might expect it to be sync.
// For Client Components: We should pass an 'isAdmin' prop or use a hook that calls the server action.
// For Server Components: We can call checkAdminStatus directly.

// Temporary sync check for backward compatibility (only checks hardcoded)
// Real role management should happen via the new Server Action
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

