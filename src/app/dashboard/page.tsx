'use client'
import { useAuth } from '../../context/AuthContext'
import { getUserOrders } from '../../lib/orders'
import { createRequest, getUserRequests, type BookRequest } from '../../lib/requests'
import { useState, useEffect } from 'react'
import type { Order } from '../../lib/types'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Request Form State
  const [reqTitle, setReqTitle] = useState('')
  const [reqAuthor, setReqAuthor] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
        Promise.all([getUserOrders(user.uid), getUserRequests(user.uid)])
            .then(([ordersData, requestsData]) => {
                setOrders(ordersData)
                setRequests(requestsData)
            })
            .catch(err => {
                console.error("Failed to load dashboard data:", err)
                // Optionally set an error state here
            })
            .finally(() => {
                setLoading(false)
            })
    }
  }, [user, authLoading, router])

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
        alert('Please sign in to request a book.')
        return
    }
    if (!reqTitle || !reqAuthor) {
        alert('Please fill in both title and author.')
        return
    }

    try {
        await createRequest({
            userId: user.uid,
            userName: user.displayName || 'Unknown',
            bookTitle: reqTitle,
            author: reqAuthor,
            status: 'pending',
            createdAt: new Date().toISOString()
        })
        setReqTitle('')
        setReqAuthor('')
        alert('Book requested successfully!')
        // Refresh requests
        const updated = await getUserRequests(user.uid)
        setRequests(updated)
    } catch (error) {
        console.error('Request submission error:', error)
        alert('Failed to submit request. Please try again later.')
    }
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
        
        {user && (
            <div className="card p-6 flex items-center gap-6 bg-white shadow-soft">
                <div className="w-20 h-20 rounded-full bg-terracotta/10 flex items-center justify-center text-3xl font-bold text-terracotta uppercase">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
                <div>
                    <h3 className="text-2xl font-bold">{user.displayName || 'Welcome, User'}</h3>
                    <p className="text-charcoal/60">{user.email}</p>
                    <p className="text-xs text-charcoal/40 mt-1">
                        Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently'}
                    </p>
                </div>
            </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card p-4">
          <div className="font-semibold mb-2">My Progress</div>
          {user ? (
            <div>
                <div className="text-3xl font-bold text-terracotta mb-1">Level 1</div>
                <div className="text-sm text-charcoal/60">XP: 0 • Streak: 0 days</div>
            </div>
          ) : (
            <div>Please sign in to view your progress.</div>
          )}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Total Orders</div>
          <div className="text-3xl font-bold text-charcoal">{orders.length}</div>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">My Requests</div>
          <div className="text-3xl font-bold text-charcoal">{requests.length}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div>
                <h3 className="text-xl font-semibold mb-4">Order History</h3>
                {loading ? <p>Loading orders...</p> : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="card p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold">Order #{order.id.slice(0, 8)}</div>
                                        <div className="text-sm text-charcoal/60">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {order.status.toUpperCase()}
                                    </div>
                                </div>
                                <div className="space-y-2 mb-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="text-sm flex justify-between">
                                            <span>{item.book.title} x{item.quantity}</span>
                                            <span>₦{(item.book.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-2 flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>₦{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <p className="text-charcoal/60">No orders yet.</p>}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4">My Book Requests</h3>
                <div className="space-y-4">
                    {requests.map(req => (
                        <div key={req.id} className="card p-4 flex justify-between items-center">
                            <div>
                                <div className="font-bold">{req.bookTitle}</div>
                                <div className="text-sm text-charcoal/60">by {req.author}</div>
                                <div className="text-xs text-charcoal/40 mt-1">{new Date(req.createdAt).toLocaleDateString()}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                req.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 
                                req.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {req.status.toUpperCase()}
                            </span>
                        </div>
                    ))}
                    {requests.length === 0 && <p className="text-charcoal/60">No requests yet.</p>}
                </div>
            </div>
          </div>

          <div>
            <div className="card p-6 bg-white sticky top-24">
                <h3 className="font-bold text-lg mb-4">Request a Book</h3>
                <p className="text-sm text-charcoal/60 mb-4">Can't find what you're looking for? Let us know!</p>
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Book Title</label>
                        <input 
                            value={reqTitle}
                            onChange={e => setReqTitle(e.target.value)}
                            className="w-full p-2 border border-beige rounded-xl"
                            placeholder="e.g. The Psychology of Money"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Author</label>
                        <input 
                            value={reqAuthor}
                            onChange={e => setReqAuthor(e.target.value)}
                            className="w-full p-2 border border-beige rounded-xl"
                            placeholder="e.g. Morgan Housel"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-2 bg-terracotta text-white rounded-xl shadow-soft">
                        Submit Request
                    </button>
                </form>
            </div>
          </div>
      </div>
    </div>
  )
}
