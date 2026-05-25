'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import type { SiteSettings } from '@/lib/settings'

export async function getSettingsAction(): Promise<SiteSettings> {
  await requireAdmin()
  const { getSettings } = await import('@/lib/settings')
  return getSettings()
}

export async function updateAllSettingsAction(settings: Partial<SiteSettings>) {
  await requireAdmin()
  const db = createServerClient()
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value: value ?? '' }))
  const { error } = await db
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })
  if (error) throw error
  revalidatePath('/', 'layout')
}
