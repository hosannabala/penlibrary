'use client'
import { getUserOrders } from '../../lib/orders'
import { getUserRequests } from '../../lib/requests'
import { getWishlist, getBooksByIds } from '../../lib/db'
import type { Order, Book } from '../../lib/types'
import type { BookRequest } from '../../lib/requests'
import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createRequest } from '../../lib/requests'

const STATUS_STYLES: Record<string, string> = {
  delivered: 'bg-green-50 text-green-700 border-green-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  fulfilled: 'bg-green-50 text-green-700 border-green-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-divider-heading">
      <span className="text-base font-bold tracking-[0.12em] uppercase text-charcoal">{children}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [wishlist, setWishlist] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  const [reqTitle, setReqTitle] = useState('')
  const [reqAuthor, setReqAuthor] = useState('')
  const [reqStatus, setReqStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [reqError, setReqError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }
    if (!user) return

    Promise.allSettled([
      getUserOrders(user.uid),
      getUserRequests(user.uid),
      getWishlist(user.uid).then(ids => getBooksByIds(ids)),
    ]).then(([ordersRes, requestsRes, wishlistRes]) => {
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
      if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value)
      if (wishlistRes.status === 'fulfilled') setWishlist(wishlistRes.value)
    }).finally(() => setLoading(false))
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-6 w-6" style={{ color: '#F07A22' }} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
        </svg>
      </div>
    )
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setReqStatus('loading')
    setReqError('')
    try {
      await createRequest({
        userId: user.uid,
        userName: user.displayName || 'Unknown',
        bookTitle: reqTitle,
        author: reqAuthor,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      setReqTitle('')
      setReqAuthor('')
      setReqStatus('success')
      const updated = await getUserRequests(user.uid)
      setRequests(updated)
      setTimeout(() => setReqStatus('idle'), 4000)
    } catch {
      setReqStatus('error')
      setReqError('Failed to submit request. Please try again.')
    }
  }

  return (
    <div className="py-8 max-w-6xl mx-auto">

      {/* Profile header */}
      <div className="flex items-center gap-5 mb-10 pb-8 border-b border-[#EBEBEB]">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName ?? 'Avatar'}
            width={64}
            height={64}
            className="rounded-full border-2 border-[#EBEBEB]"
          />
        ) : (
          <div
            className="w-16 h-16 flex items-center justify-center text-2xl font-bold text-white uppercase"
            style={{ backgroundColor: '#1E3777' }}
          >
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{user.displayName || 'My Account'}</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Requests', value: requests.length },
          { label: 'Wishlist', value: wishlist.length },
        ].map(stat => (
          <div key={stat.label} className="border border-[#EBEBEB] p-3 sm:p-5">
            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/40 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-2">

          {/* Order History */}
          <SectionHeading>Order History</SectionHeading>
          {loading ? (
            <p className="text-sm text-charcoal/50 py-4">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="border border-[#EBEBEB] p-8 text-center">
              <p className="text-charcoal/50 text-sm mb-4">No orders yet.</p>
              <Link
                href="/catalog"
                className="inline-block px-6 py-2.5 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F07A22' }}
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="border border-[#EBEBEB] p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-charcoal">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-charcoal/40 mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-charcoal/70 line-clamp-1">{item.book.title} <span className="text-charcoal/40">×{item.quantity}</span></span>
                        <span className="text-charcoal font-medium shrink-0 ml-4">₦{(item.book.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#EBEBEB] pt-3 flex justify-between items-center">
                    <span className="text-xs text-charcoal/40 uppercase tracking-wide font-semibold">Total</span>
                    <span className="font-bold text-charcoal">₦{order.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Book Requests */}
          <SectionHeading>My Book Requests</SectionHeading>
          {requests.length === 0 ? (
            <p className="text-sm text-charcoal/50 py-2">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="border border-[#EBEBEB] p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{req.bookTitle}</p>
                    <p className="text-xs text-charcoal/50">by {req.author}</p>
                    <p className="text-xs text-charcoal/30 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}

          {/* Wishlist */}
          <SectionHeading>My Wishlist</SectionHeading>
          {wishlist.length === 0 ? (
            <p className="text-sm text-charcoal/50 py-2">No items saved.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wishlist.map(book => (
                <Link
                  key={book.id}
                  href={`/catalog/${book.id}` as any}
                  className="group border border-[#EBEBEB] hover:border-[#F07A22]/40 transition-colors p-3 flex gap-3"
                >
                  <div className="relative w-12 h-16 shrink-0 bg-[#F0EDE8] overflow-hidden">
                    {book.coverUrl ? (
                      <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-charcoal/20 font-bold text-lg">
                        {book.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-charcoal line-clamp-2 group-hover:text-[#F07A22] transition-colors leading-snug">{book.title}</p>
                    <p className="text-[11px] text-charcoal/40 mt-0.5 truncate">{book.author}</p>
                    <p className="text-xs font-bold mt-1.5" style={{ color: '#F07A22' }}>₦{book.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — Request a Book */}
        <div>
          <div className="border border-[#EBEBEB] p-6 sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-1">Request a Book</h3>
            <p className="text-xs text-charcoal/50 mb-5">Can&apos;t find what you&apos;re looking for? Let us know.</p>

            {reqStatus === 'success' ? (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                Request submitted! We&apos;ll be in touch.
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mb-1.5">Book Title *</label>
                  <input
                    value={reqTitle}
                    onChange={e => setReqTitle(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#EBEBEB] text-sm focus:outline-none focus:border-charcoal/40 transition-colors"
                    placeholder="e.g. The Psychology of Money"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mb-1.5">Author *</label>
                  <input
                    value={reqAuthor}
                    onChange={e => setReqAuthor(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#EBEBEB] text-sm focus:outline-none focus:border-charcoal/40 transition-colors"
                    placeholder="e.g. Morgan Housel"
                    required
                  />
                </div>
                {reqStatus === 'error' && (
                  <p className="text-xs text-red-600">{reqError}</p>
                )}
                <button
                  type="submit"
                  disabled={reqStatus === 'loading'}
                  className="w-full py-3 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#1E3777' }}
                >
                  {reqStatus === 'loading' ? 'Submitting…' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
