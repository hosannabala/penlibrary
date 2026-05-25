import { supabase } from './supabase'
import type { Book, Category, ClubMeeting, ClubMember, ClubRSVP } from './types'

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapBook(r: any): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    price: Number(r.price),
    salePrice: r.sale_price != null ? Number(r.sale_price) : undefined,
    costPrice: r.cost_price != null ? Number(r.cost_price) : undefined,
    category: r.category ?? '',
    coverUrl: r.cover_url ?? undefined,
    description: r.description ?? undefined,
    featured: r.featured ?? false,
    stock: r.stock ?? 0,
    preOrder: r.pre_order ?? false,
    bestSeller: r.best_seller ?? false,
    createdAt: r.created_at ?? undefined,
  }
}

function mapCategory(r: any): Category {
  return { id: r.id, name: r.name, slug: r.slug }
}

function mapMeeting(r: any): ClubMeeting {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.time ?? undefined,
    type: r.type,
    description: r.description ?? undefined,
    bookId: r.book_id ?? undefined,
    bookTitle: r.book_title ?? undefined,
    meetingLink: r.meeting_link ?? undefined,
    location: r.location ?? undefined,
  }
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function getAllBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapBook)
}

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return mapBook(data)
}

export async function addBook(book: Omit<Book, 'id'>) {
  const { data, error } = await supabase.from('books').insert({
    title: book.title,
    author: book.author,
    price: book.price,
    sale_price: book.salePrice ?? null,
    cost_price: book.costPrice ?? null,
    category: book.category,
    cover_url: book.coverUrl ?? null,
    description: book.description ?? null,
    featured: book.featured ?? false,
    stock: book.stock,
    pre_order: book.preOrder ?? false,
    best_seller: book.bestSeller ?? false,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateBook(id: string, updates: Partial<Book>) {
  const payload: Record<string, any> = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.author !== undefined) payload.author = updates.author
  if (updates.price !== undefined) payload.price = updates.price
  if (updates.salePrice !== undefined) payload.sale_price = updates.salePrice
  if (updates.costPrice !== undefined) payload.cost_price = updates.costPrice
  if (updates.category !== undefined) payload.category = updates.category
  if (updates.coverUrl !== undefined) payload.cover_url = updates.coverUrl
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.featured !== undefined) payload.featured = updates.featured
  if (updates.stock !== undefined) payload.stock = updates.stock
  if (updates.preOrder !== undefined) payload.pre_order = updates.preOrder
  if (updates.bestSeller !== undefined) payload.best_seller = updates.bestSeller

  const { error } = await supabase.from('books').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []).map(mapCategory)
}

export async function addCategory(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  const { error } = await supabase.from('categories').insert({ name, slug })
  if (error) throw error
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Club Meetings ────────────────────────────────────────────────────────────

export async function getClubMeetings(): Promise<ClubMeeting[]> {
  const { data, error } = await supabase
    .from('club_meetings')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapMeeting)
}

export async function addClubMeeting(meeting: Omit<ClubMeeting, 'id'>) {
  const { error } = await supabase.from('club_meetings').insert({
    title: meeting.title,
    date: meeting.date,
    time: meeting.time ?? null,
    type: meeting.type,
    description: meeting.description ?? null,
    book_id: meeting.bookId ?? null,
    book_title: meeting.bookTitle ?? null,
    meeting_link: meeting.meetingLink ?? null,
    location: meeting.location ?? null,
  })
  if (error) throw error
}

export async function updateClubMeeting(id: string, updates: Partial<ClubMeeting>) {
  const payload: Record<string, any> = {}
  if (updates.title !== undefined) payload.title = updates.title
  if (updates.date !== undefined) payload.date = updates.date
  if (updates.time !== undefined) payload.time = updates.time
  if (updates.type !== undefined) payload.type = updates.type
  if (updates.description !== undefined) payload.description = updates.description
  if (updates.bookId !== undefined) payload.book_id = updates.bookId
  if (updates.bookTitle !== undefined) payload.book_title = updates.bookTitle
  if (updates.meetingLink !== undefined) payload.meeting_link = updates.meetingLink
  if (updates.location !== undefined) payload.location = updates.location

  const { error } = await supabase.from('club_meetings').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteClubMeeting(id: string) {
  const { error } = await supabase.from('club_meetings').delete().eq('id', id)
  if (error) throw error
}

// ─── Club Members ─────────────────────────────────────────────────────────────

export async function addClubMember(email: string, uid?: string) {
  const { error } = await supabase.from('club_members').insert({ email, uid: uid ?? null })
  if (error) throw error
}

// ─── RSVPs ────────────────────────────────────────────────────────────────────

export async function rsvpMeeting(meetingId: string, uid: string, email?: string) {
  const { error } = await supabase
    .from('club_rsvps')
    .upsert({ meeting_id: meetingId, uid, email: email ?? null }, { onConflict: 'meeting_id,uid' })
  if (error) throw error
}

export async function hasUserRSVP(meetingId: string, uid: string): Promise<boolean> {
  const { count } = await supabase
    .from('club_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', meetingId)
    .eq('uid', uid)
  return (count ?? 0) > 0
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function getWishlist(uid: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_profiles')
    .select('wishlist')
    .eq('uid', uid)
    .single()
  return data?.wishlist ?? []
}

export async function toggleWishlist(uid: string, bookId: string): Promise<string[]> {
  const current = await getWishlist(uid)
  const updated = current.includes(bookId)
    ? current.filter(id => id !== bookId)
    : [...current, bookId]
  const { error } = await supabase
    .from('user_profiles')
    .update({ wishlist: updated })
    .eq('uid', uid)
  if (error) throw error
  return updated
}

export async function getBooksByIds(ids: string[]): Promise<Book[]> {
  if (!ids.length) return []
  const { data, error } = await supabase.from('books').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []).map(mapBook)
}
