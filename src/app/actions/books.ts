'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import type { Book } from '@/lib/types'

export async function addBookAction(book: Omit<Book, 'id'>) {
  await requireAdmin()
  const db = createServerClient()
  const { data, error } = await db.from('books').insert({
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
  if (error) {
    if (error.code === '23505') throw new Error(`"${book.title}" by ${book.author} already exists in inventory.`)
    throw error
  }
  revalidatePath('/')
  revalidatePath('/catalog')
  return data
}

export async function updateBookAction(id: string, updates: Partial<Book>) {
  await requireAdmin()
  const db = createServerClient()
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
  const { error } = await db.from('books').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/catalog')
  revalidatePath(`/catalog/${id}`)
}

export async function deleteBookAction(id: string) {
  await requireAdmin()
  const db = createServerClient()
  const { error } = await db.from('books').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/catalog')
}

export async function addCategoryAction(name: string) {
  await requireAdmin()
  const db = createServerClient()
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  const { error } = await db.from('categories').insert({ name, slug })
  if (error) {
    if (error.code === '23505') throw new Error(`"${name}" already exists as a category.`)
    throw error
  }
  revalidatePath('/')
  revalidatePath('/catalog')
  revalidatePath('/', 'layout')
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin()
  const db = createServerClient()
  const { data: cat } = await db.from('categories').select('name').eq('id', id).single()
  if (cat?.name) {
    await db.from('books').update({ category: null }).eq('category', cat.name)
  }
  const { error } = await db.from('categories').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/catalog')
  revalidatePath('/', 'layout')
}

export type BulkImportResult = {
  added: number
  skipped: number
}

export async function bulkAddBooksAction(rows: Omit<Book, 'id'>[]): Promise<BulkImportResult> {
  await requireAdmin()
  const db = createServerClient()

  const payload = rows.map(book => ({
    title: book.title,
    author: book.author,
    price: book.price,
    sale_price: book.salePrice ?? null,
    cost_price: book.costPrice ?? null,
    category: book.category || null,
    cover_url: book.coverUrl ?? null,
    description: book.description ?? null,
    featured: book.featured ?? false,
    stock: book.stock,
    pre_order: book.preOrder ?? false,
    best_seller: book.bestSeller ?? false,
  }))

  const { data, error } = await db
    .from('books')
    .upsert(payload, { onConflict: 'title,author', ignoreDuplicates: true })
    .select('id')

  if (error) throw error

  const added = data?.length ?? 0
  return { added, skipped: rows.length - added }
}
