'use server'

import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'

export async function checkAdminStatus(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  try {
    const supabase = createServerClient()
    const { data } = await supabase.from('admins').select('uid').eq('email', email).limit(1)
    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

export async function addAdmin(email: string, _addedBy: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { data: existing } = await supabase.from('admins').select('uid').eq('email', email).limit(1)
  if (existing?.length) return { success: false, message: 'User is already an admin' }
  const { error } = await supabase.from('admins').insert({ uid: email, email })
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Admin added successfully' }
}

export async function removeAdmin(email: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('admins').delete().eq('email', email)
  if (error) return { success: false, message: error.message }
  return { success: true, message: 'Admin removed successfully' }
}

export async function getAdmins() {
  await requireAdmin()
  const supabase = createServerClient()
  const { data } = await supabase.from('admins').select('*')
  return { firestoreAdmins: data ?? [], legacyAdmins: [] }
}
