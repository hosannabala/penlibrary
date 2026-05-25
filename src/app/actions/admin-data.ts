'use server'

import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import type { Order, ClubMeeting, Book, Category } from '@/lib/types'
import type { BookRequest } from '@/lib/requests'

function mapOrder(r: any): Order {
  return {
    id: r.id,
    userId: r.user_id,
    items: r.items ?? [],
    total: Number(r.total),
    status: r.status,
    paymentReference: r.payment_reference,
    paymentStatus: r.payment_status,
    amountPaid: r.amount_paid != null ? Number(r.amount_paid) : undefined,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    deliveryMethod: r.delivery_method,
    address: r.address,
    createdAt: r.created_at,
  }
}

function mapRequest(r: any): BookRequest {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    bookTitle: r.book_title,
    author: r.author,
    status: r.status,
    createdAt: r.created_at,
  }
}

// ─── Books (admin read) ───────────────────────────────────────────────────────

export async function getAllBooksAction(): Promise<Book[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db.from('books').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
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
  }))
}

export async function getAllCategoriesAction(): Promise<Category[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db.from('categories').select('*').order('name')
  if (error) throw error
  return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, slug: r.slug }))
}

export async function getAllMeetingsAction(): Promise<ClubMeeting[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db.from('club_meetings').select('*').order('date', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id, title: r.title, date: r.date, time: r.time ?? undefined,
    type: r.type, description: r.description ?? undefined,
    bookId: r.book_id ?? undefined, bookTitle: r.book_title ?? undefined,
    meetingLink: r.meeting_link ?? undefined, location: r.location ?? undefined,
  }))
}

export async function getGalleryAction(): Promise<{ id: string; url: string; title?: string }[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db.from('gallery').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({ id: r.id, url: r.url, title: r.title ?? undefined }))
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getAllOrdersAction(): Promise<Order[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapOrder)
}

export async function updateOrderStatusAction(id: string, status: Order['status']): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Book Requests ────────────────────────────────────────────────────────────

export async function getAllRequestsAction(): Promise<BookRequest[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db
    .from('book_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRequest)
}

export async function updateRequestStatusAction(id: string, status: BookRequest['status']): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('book_requests').update({ status }).eq('id', id)
  if (error) throw error
}

// ─── Club Meetings ────────────────────────────────────────────────────────────

export async function addMeetingAction(meeting: Omit<ClubMeeting, 'id'>): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('club_meetings').insert({
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

export async function updateMeetingAction(id: string, updates: Partial<ClubMeeting>): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
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
  const { error } = await db.from('club_meetings').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteMeetingAction(id: string): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('club_meetings').delete().eq('id', id)
  if (error) throw error
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function addGalleryItemAction(url: string, title?: string): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('gallery').insert({ url, title: title ?? null })
  if (error) throw error
}

export async function deleteGalleryItemAction(id: string): Promise<void> {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('gallery').delete().eq('id', id)
  if (error) throw error
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string
  email: string
  displayName: string
  createdAt: string
  lastSignIn: string | null
  provider: string
}

export async function getAdminUsersAction(): Promise<AdminUser[]> {
  await requireAdmin()
  const db = createServerClient()
  const { data: { users }, error } = await db.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    displayName: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? '—') as string,
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    provider: (u.app_metadata?.provider ?? 'email') as string,
  }))
}
