import { createServerClient } from './supabase'

export type SiteSettings = {
  email: string
  phone: string
  address: string
  pickup_address: string
  instagram_url: string
  whatsapp_community_url: string
  whatsapp_group_url: string
  announcement_bar: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  email: 'penlibrary@email.com',
  phone: '2348000000000',
  address: 'Okuru-Ama, Port Harcourt, Rivers State, Nigeria',
  pickup_address: 'Pen Library Services, Port Harcourt, Rivers State',
  instagram_url: 'https://instagram.com/pen_library_services',
  whatsapp_community_url: '',
  whatsapp_group_url: '',
  announcement_bar: 'Free delivery on orders over ₦20,000 · Nationwide shipping across Nigeria',
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const db = createServerClient()
    const { data, error } = await db.from('site_settings').select('key, value')
    if (error || !data) return DEFAULT_SETTINGS
    const map: Record<string, string> = {}
    for (const row of data) map[row.key] = row.value
    return { ...DEFAULT_SETTINGS, ...map }
  } catch {
    return DEFAULT_SETTINGS
  }
}
