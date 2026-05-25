import { supabase } from './supabase'

export type GalleryItem = {
  id: string
  url: string
  title?: string
}

export async function getGallery(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []).map(r => ({ id: r.id, url: r.url, title: r.title ?? undefined }))
}

export async function addGalleryItem(url: string, title?: string) {
  const { error } = await supabase.from('gallery').insert({ url, title: title ?? null })
  if (error) throw error
}

export async function deleteGalleryItem(id: string) {
  const { error } = await supabase.from('gallery').delete().eq('id', id)
  if (error) throw error
}
