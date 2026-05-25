import { supabase } from './supabase'

export type BookRequest = {
  id: string
  userId: string
  userName: string
  bookTitle: string
  author: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  createdAt: string
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

export async function createRequest(request: Omit<BookRequest, 'id'>) {
  const { error } = await supabase.from('book_requests').insert({
    user_id: request.userId,
    user_name: request.userName,
    book_title: request.bookTitle,
    author: request.author,
    status: request.status ?? 'pending',
  })
  if (error) throw error
}

export async function getUserRequests(userId: string): Promise<BookRequest[]> {
  const { data, error } = await supabase
    .from('book_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRequest)
}

export async function getAllRequests(): Promise<BookRequest[]> {
  const { data, error } = await supabase
    .from('book_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapRequest)
}

export async function updateRequestStatus(id: string, status: BookRequest['status']) {
  const { error } = await supabase.from('book_requests').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteRequest(id: string) {
  const { error } = await supabase.from('book_requests').delete().eq('id', id)
  if (error) throw error
}
