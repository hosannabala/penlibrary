import type { MetadataRoute } from 'next'
import { getAllBooks } from '@/lib/db'
import { createServerClient } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://penlibrary.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/club`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/consulting`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  let bookPages: MetadataRoute.Sitemap = []
  try {
    const db = createServerClient()
    const { data } = await db
      .from('books')
      .select('id, created_at')
      .order('created_at', { ascending: false })
    bookPages = (data ?? []).map(b => ({
      url: `${BASE}/catalog/${b.id}`,
      lastModified: new Date(b.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch {
    // sitemap still works without book pages
  }

  return [...staticPages, ...bookPages]
}
