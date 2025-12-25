export const ADMIN_EMAILS = [
  'admin@penlibrary.com',
  // Add your admin email here to gain access
  'hosannabala4u@gmail.com' 
]

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
