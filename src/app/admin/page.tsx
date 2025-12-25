'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllBooks, addBook, updateBook, deleteBook, getAllCategories, addCategory, deleteCategory, getClubMeetings, addClubMeeting, updateClubMeeting, deleteClubMeeting } from '../../lib/db'
import { getGallery, addGalleryItem, deleteGalleryItem, type GalleryItem } from '../../lib/gallery'
import { subscribeToOrders, updateOrderStatus } from '../../lib/orders'
import { getAllRequests, updateRequestStatus, type BookRequest } from '../../lib/requests'
import { storage } from '../../lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../../context/AuthContext'
import type { Book, Order, Category, ClubMeeting } from '../../lib/types'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isAdmin } from '../../lib/admin'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'books' | 'gallery' | 'orders' | 'analytics' | 'requests' | 'categories' | 'club'>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  
  // Book State
  const [editing, setEditing] = useState<Book | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '', author: '', price: 0, costPrice: 0, category: '', stock: 1, coverUrl: ''
  })
  
  // Category State
  const [newCategory, setNewCategory] = useState('')

  // Club Meeting State
  const [meetingForm, setMeetingForm] = useState<Partial<ClubMeeting>>({
    title: '', date: '', time: '', location: '', description: '', type: 'discussion', meetingLink: ''
  })
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ClubMeeting | null>(null)

  // Gallery State
  const [galleryUrl, setGalleryUrl] = useState('')
  const [galleryTitle, setGalleryTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const { loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
        if (!user) {
            router.push('/')
        } else if (!isAdmin(user.email)) {
            // Stay on page but show access denied in render, or redirect home
            // For better UX, let's just handle it in render
        }
    }
  }, [user, authLoading, router])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const storageRef = ref(storage, `books/${Date.now()}_${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      setFormData(prev => ({ ...prev, coverUrl: url }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission()
    }

    function playNotify() {
        try {
            const audio = new Audio('/notification.mp3')
            audio.play().catch(() => {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const o = ctx.createOscillator()
                const g = ctx.createGain()
                o.type = 'sine'
                o.frequency.value = 880
                g.gain.value = 0.05
                o.connect(g)
                g.connect(ctx.destination)
                o.start()
                setTimeout(() => { o.stop() }, 300)
            })
        } catch {}
    }
    const unsubscribe = subscribeToOrders((newOrders) => {
        setOrders(prev => {
            if (newOrders.length > prev.length && prev.length > 0) {
                playNotify()
                
                // Send push notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Order Received!', {
                        body: `Order #${newOrders[0].id.slice(0, 8)} has been placed.`,
                        icon: '/logo.svg'
                    })
                }
            }
            return newOrders
        })
    })
    return () => unsubscribe()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
        const [booksData, galleryData, requestsData, categoriesData, meetingsData] = await Promise.all([
            getAllBooks(), 
            getGallery(), 
            getAllRequests(),
            getAllCategories(),
            getClubMeetings()
        ])
        setBooks(booksData)
        setGallery(galleryData)
        setRequests(requestsData)
        setCategories(categoriesData)
        setMeetings(meetingsData)
    } catch (error: any) {
        console.error("Data fetch error:", error)
        if (error?.message?.includes('offline')) {
            alert('You seem to be offline. Some data may not load correctly.')
        }
    } finally {
        setLoading(false)
    }
  }

  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault()
    try {
        if (editingMeeting) {
            await updateClubMeeting(editingMeeting.id, meetingForm as Partial<ClubMeeting>)
        } else {
            await addClubMeeting(meetingForm as Omit<ClubMeeting, 'id'>)
        }
        setIsMeetingFormOpen(false)
        setEditingMeeting(null)
        setMeetingForm({ title: '', date: '', time: '', location: '', description: '', type: 'discussion', meetingLink: '' })
        const updated = await getClubMeetings()
        setMeetings(updated)
    } catch (error) {
        alert('Failed to add meeting')
    }
  }

  async function handleDeleteMeeting(id: string) {
    if (confirm('Delete this meeting?')) {
        await deleteClubMeeting(id)
        const updated = await getClubMeetings()
        setMeetings(updated)
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
        await addCategory(newCategory.trim())
        setNewCategory('')
        const updated = await getAllCategories()
        setCategories(updated)
    } catch (error) {
        alert('Failed to add category')
    }
  }

  async function handleDeleteCategory(id: string) {
    if (confirm('Are you sure? deleting a category might affect books linked to it.')) {
        await deleteCategory(id)
        const updated = await getAllCategories()
        setCategories(updated)
    }
  }

  // ... (Keep existing Book helpers: totalValue, totalStock, lowStockCount, handleSubmit, handleDelete, handleEdit)

  const totalValue = books.reduce((acc, b) => acc + (b.price * b.stock), 0)
  const totalStock = books.reduce((acc, b) => acc + b.stock, 0)
  const lowStockCount = books.filter(b => b.stock < 3).length
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0)
  const pendingRequests = requests.filter(r => r.status === 'pending').length

  // ... (Keep existing handlers: handleSubmit, handleDelete, handleEdit, handleAddGallery, handleDeleteGallery, downloadInventoryCSV)

  async function handleRequestStatus(id: string, status: BookRequest['status']) {
    await updateRequestStatus(id, status)
    fetchData()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateBook(editing.id, formData)
      } else {
        await addBook(formData as Omit<Book, 'id'>)
      }
      setIsFormOpen(false)
      setEditing(null)
      setFormData({ title: '', author: '', price: 0, category: '', stock: 1, coverUrl: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to save book:', error)
      alert('Failed to save book. Please try again.')
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure?')) {
      await deleteBook(id)
      fetchData()
    }
  }

  function handleEdit(book: Book) {
    setEditing(book)
    setFormData(book)
    setIsFormOpen(true)
  }

  async function handleAddGallery(e: React.FormEvent) {
    e.preventDefault()
    if (!galleryUrl) return
    try {
      await addGalleryItem(galleryUrl, galleryTitle)
      setGalleryUrl('')
      setGalleryTitle('')
      fetchData()
    } catch (error) {
      alert('Failed to add image')
    }
  }

  async function handleDeleteGallery(id: string) {
    if (confirm('Delete this image?')) {
      await deleteGalleryItem(id)
      fetchData()
    }
  }

  function downloadInventoryCSV() {
    const headers = ['ID', 'Title', 'Author', 'Price', 'Stock', 'Category']
    const rows = books.map(b => [b.id, b.title, b.author, b.price, b.stock, b.category])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "inventory_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function downloadInventoryPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Pen Library - Inventory Report", 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
    
    const tableRows = books.map(book => [book.title, book.author, book.price, book.stock, book.category])
    
    autoTable(doc, {
        head: [['Title', 'Author', 'Price', 'Stock', 'Category']],
        body: tableRows,
        startY: 35,
    })
    
    doc.save('inventory_report.pdf')
  }

  function downloadPurchaseListPDF() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Pen Library - Purchase List Report", 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

    const bookSales: Record<string, { title: string, sold: number, stock: number }> = {}
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!bookSales[item.book.id]) {
                bookSales[item.book.id] = { title: item.book.title, sold: 0, stock: item.book.stock }
            }
            bookSales[item.book.id].sold += item.quantity
        })
    })

    const tableRows = Object.values(bookSales)
        .sort((a, b) => b.sold - a.sold)
        .map(b => [b.title, b.sold, b.stock])

    autoTable(doc, {
        head: [['Book Title', 'Total Sold', 'Current Stock']],
        body: tableRows,
        startY: 35,
    })

    doc.save('purchase_list_report.pdf')
  }

  function downloadRequestsCSV() {
    const reqStats: Record<string, number> = {}
    requests.forEach(r => {
        const key = `${r.bookTitle} by ${r.author}`
        reqStats[key] = (reqStats[key] || 0) + 1
    })
    
    const rows = Object.entries(reqStats)
        .sort(([, a], [, b]) => b - a)
        .map(([title, count]) => [title, count])
        
    const headers = ['Book Title', 'Request Count']
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "requests_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function downloadPurchaseList() {
    const bookSales: Record<string, { title: string, sold: number, stock: number }> = {}
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!bookSales[item.book.id]) {
                bookSales[item.book.id] = { 
                    title: item.book.title, 
                    sold: 0, 
                    stock: item.book.stock 
                }
            }
            bookSales[item.book.id].sold += item.quantity
        })
    })

    const rows = Object.values(bookSales)
        .sort((a, b) => b.sold - a.sold)
        .map(b => [b.title, b.sold, b.stock])
        
    const headers = ['Book Title', 'Total Sold', 'Current Stock']
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "purchase_list_report.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  if (!isAdmin(user.email)) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold text-terracotta mb-4">Access Denied</h1>
            <p className="text-charcoal/60 max-w-md mb-6">
                You do not have permission to view the admin portal. 
                Please contact the system administrator if you believe this is an error.
            </p>
            <div className="bg-offwhite p-4 rounded-xl text-sm font-mono mb-6">
                Your Email: {user.email}
            </div>
            <button 
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-charcoal text-white rounded-xl"
            >
                Return to Home
            </button>
        </div>
    )
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-white shadow-soft">
            <div className="text-sm text-charcoal/60 font-medium mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-terracotta">₦{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-charcoal/40 mt-2">From {orders.length} orders</div>
          </div>

          <div className="card p-6 bg-white shadow-soft">
            <div className="text-sm text-charcoal/60 font-medium mb-1">Inventory Value</div>
            <div className="text-3xl font-bold text-charcoal">₦{totalValue.toLocaleString()}</div>
            <div className="text-xs text-charcoal/40 mt-2">Based on current stock</div>
          </div>
          
          <div className="card p-6 bg-white shadow-soft">
            <div className="text-sm text-charcoal/60 font-medium mb-1">Books in Stock</div>
            <div className="text-3xl font-bold text-charcoal">{totalStock}</div>
            <div className="text-xs text-charcoal/40 mt-2">Across {books.length} titles</div>
          </div>
          
          <div className="card p-6 bg-white shadow-soft">
            <div className="text-sm text-charcoal/60 font-medium mb-1">Book Requests</div>
            <div className="text-3xl font-bold text-terracotta">{pendingRequests}</div>
            <div className="text-xs text-charcoal/40 mt-2">Pending requests</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-beige mb-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('books')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'books' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Book Inventory
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'orders' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'gallery' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Gallery Management
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'requests' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Requests
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'categories' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('club')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'club' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Events
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-4 font-medium transition-colors shrink-0 ${activeTab === 'analytics' ? 'text-terracotta border-b-2 border-terracotta' : 'text-charcoal/60 hover:text-charcoal'}`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'books' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3">
                <button onClick={downloadInventoryCSV} className="px-4 py-2 rounded-xl border border-beige text-charcoal/70 hover:bg-offwhite text-sm">
                  Export CSV
                </button>
                <button onClick={downloadInventoryPDF} className="px-4 py-2 rounded-xl border border-beige text-charcoal/70 hover:bg-offwhite text-sm">
                  Export PDF
                </button>
              </div>
              <button 
                onClick={() => { setEditing(null); setIsFormOpen(true) }} 
                className="px-4 py-2 rounded-2xl bg-terracotta text-white shadow-soft flex items-center gap-2"
              >
                <span>+</span> Add New Book
              </button>
            </div>

            <div className="grid gap-4">
              {loading ? <p>Loading books...</p> : books.map(book => (
                <div key={book.id} className="card p-4 flex justify-between items-center group hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    {book.coverUrl && <img src={book.coverUrl} className="w-12 h-16 object-cover rounded shadow-sm" alt="" />}
                    <div>
                      <div className="font-semibold">{book.title}</div>
                      <div className="text-sm text-charcoal/70">{book.author} • ₦{book.price.toLocaleString()}</div>
                      {book.stock < 3 && <div className="text-xs text-red-500 font-bold mt-1">Low Stock: {book.stock} left</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(book)} className="text-sm px-3 py-1 bg-beige rounded-lg">Edit</button>
                    <button onClick={() => handleDelete(book.id)} className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="card p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="font-bold flex items-center gap-2">
                                Order #{order.id.slice(0, 8)}
                                <span className="text-xs font-normal text-charcoal/60">by {order.customerName}</span>
                            </div>
                            <div className="text-sm text-charcoal/60">{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {order.status.toUpperCase()}
                        </div>
                    </div>
                    <div className="space-y-1 mb-3 bg-offwhite/50 p-3 rounded-lg">
                        {order.items.map((item, i) => (
                            <div key={i} className="text-sm flex justify-between">
                                <span>{item.book.title} x{item.quantity}</span>
                                <span>₦{(item.book.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>₦{order.total.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => updateOrderStatus(order.id, 'completed').then(fetchData)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs">Mark Completed</button>
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled').then(fetchData)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs">Cancel</button>
                    </div>
                </div>
            ))}
            {orders.length === 0 && <p className="text-charcoal/60">No orders yet.</p>}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            <form onSubmit={handleAddGallery} className="card p-6 mb-8 flex gap-4 items-end">
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input 
                  value={galleryUrl} 
                  onChange={e => setGalleryUrl(e.target.value)} 
                  className="w-full p-2 border rounded-xl" 
                  placeholder="https://..." 
                  required 
                />
              </div>
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-1">Caption (Optional)</label>
                <input 
                  value={galleryTitle} 
                  onChange={e => setGalleryTitle(e.target.value)} 
                  className="w-full p-2 border rounded-xl" 
                  placeholder="Event description..." 
                />
              </div>
              <button type="submit" className="px-6 py-2 bg-terracotta text-white rounded-xl h-10">Add Image</button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map(item => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeleteGallery(item.id)} className="text-white bg-red-500 px-3 py-1 rounded-lg text-sm">Delete</button>
                  </div>
                  {item.title && <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-2 truncate">{item.title}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-12 text-charcoal/60">No book requests yet.</div>
                ) : requests.map(request => (
                    <div key={request.id} className="card p-4 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{request.bookTitle}</div>
                            <div className="text-sm text-charcoal/70">by {request.author}</div>
                            <div className="text-xs text-charcoal/40 mt-1">Requested by {request.userName} • {new Date(request.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                request.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 
                                request.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {request.status.toUpperCase()}
                            </span>
                            {request.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleRequestStatus(request.id, 'fulfilled')} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">Mark Fulfilled</button>
                                    <button onClick={() => handleRequestStatus(request.id, 'cancelled')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'categories' && (
            <div className="max-w-4xl">
                <div className="card p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
                    <form onSubmit={handleAddCategory} className="flex gap-4">
                        <input 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Category Name (e.g. Science Fiction)"
                            className="flex-grow p-3 border rounded-xl"
                        />
                        <button type="submit" className="px-6 py-3 bg-terracotta text-white rounded-xl">
                            Add Category
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <div key={cat.id} className="card p-4 flex justify-between items-center">
                            <span className="font-medium">{cat.name}</span>
                            <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && <p className="text-charcoal/60">No categories found.</p>}
                </div>
            </div>
        )}

        {activeTab === 'club' && (
            <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Event Management</h3>
                    <button 
                        onClick={() => { setEditingMeeting(null); setMeetingForm({ title: '', date: '', time: '', location: '', description: '', type: 'discussion', meetingLink: '' }); setIsMeetingFormOpen(true) }}
                        className="px-4 py-2 bg-terracotta text-white rounded-xl shadow-soft"
                    >
                        + Schedule Event
                    </button>
                </div>

                <div className="space-y-4">
                    {meetings.map(meeting => (
                        <div key={meeting.id} className="card p-6 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        meeting.type === 'discussion' ? 'bg-blue-100 text-blue-700' :
                                        meeting.type === 'event' ? 'bg-purple-100 text-purple-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {meeting.type.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-charcoal/60">{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</span>
                                </div>
                                <h4 className="font-bold text-lg">{meeting.title}</h4>
                                <p className="text-charcoal/70 mb-2">{meeting.description}</p>
                                <div className="text-sm flex gap-4 text-charcoal/60">
                                    <span>📍 {meeting.location}</span>
                                    {meeting.bookTitle && <span>📖 {meeting.bookTitle}</span>}
                                </div>
                            </div>
                            <div className="flex gap-2 self-start md:self-center">
                                <button 
                                    onClick={() => { setEditingMeeting(meeting); setMeetingForm(meeting); setIsMeetingFormOpen(true) }}
                                    className="px-4 py-2 bg-beige text-charcoal rounded-lg text-sm"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteMeeting(meeting.id)}
                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                    {meetings.length === 0 && <p className="text-charcoal/60 text-center py-12">No upcoming meetings scheduled.</p>}
                </div>
            </div>
        )}

        {activeTab === 'analytics' && (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Sales Performance</h3>
                    <div className="flex gap-4">
                        <button onClick={downloadPurchaseList} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <span>Download Sales Report (CSV)</span>
                        </button>
                        <button onClick={downloadPurchaseListPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                            <span>Download Sales Report (PDF)</span>
                        </button>
                        <button onClick={downloadRequestsCSV} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <span>Download Requests Report (CSV)</span>
                        </button>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="card p-6 bg-white md:col-span-2">
                        <h4 className="font-semibold mb-4">Daily Sales Performance</h4>
                        {orders.length === 0 ? (
                            <div className="h-[300px] w-full flex flex-col items-center justify-center text-charcoal/60 bg-offwhite/30 rounded-xl border border-dashed border-beige">
                                <p>No sales data available yet.</p>
                                <p className="text-xs mt-2">Charts will appear here once you receive orders.</p>
                            </div>
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={(() => {
                                        const dailyStats: Record<string, number> = {}
                                        orders.forEach(order => {
                                            const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            dailyStats[date] = (dailyStats[date] || 0) + order.total
                                        })
                                        return Object.entries(dailyStats)
                                            .map(([date, total]) => ({ date, total }))
                                            .slice(-7) // Last 7 days
                                    })()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} tickFormatter={(val) => `₦${val/1000}k`} />
                                        <Tooltip 
                                            cursor={{fill: '#F5F5F0'}}
                                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}
                                            formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Total Sales']}
                                        />
                                        <Bar dataKey="total" fill="#D97757" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    <div className="card p-6 bg-white">
                        <h4 className="font-semibold mb-4">Top Selling Books</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-beige">
                                        <th className="pb-3 font-medium text-charcoal/60">Book Title</th>
                                        <th className="pb-3 font-medium text-charcoal/60">Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const bookStats: Record<string, any> = {}
                                        orders.forEach(o => o.items.forEach(i => {
                                            if (!bookStats[i.book.id]) {
                                                bookStats[i.book.id] = { ...i.book, sold: 0 }
                                            }
                                            bookStats[i.book.id].sold += i.quantity
                                        }))
                                        return Object.values(bookStats)
                                            .sort((a: any, b: any) => b.sold - a.sold)
                                            .slice(0, 5)
                                            .map((book: any) => (
                                                <tr key={book.id} className="border-b border-offwhite last:border-0">
                                                    <td className="py-3 text-sm">{book.title}</td>
                                                    <td className="py-3 font-bold text-sm">{book.sold}</td>
                                                </tr>
                                            ))
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card p-6 bg-white">
                        <h4 className="font-semibold mb-4">Most Requested Books</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-beige">
                                        <th className="pb-3 font-medium text-charcoal/60">Book Title</th>
                                        <th className="pb-3 font-medium text-charcoal/60">Requests</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const reqStats: Record<string, number> = {}
                                        requests.forEach(r => {
                                            const key = `${r.bookTitle} by ${r.author}`
                                            reqStats[key] = (reqStats[key] || 0) + 1
                                        })
                                        return Object.entries(reqStats)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 5)
                                            .map(([title, count]) => (
                                                <tr key={title} className="border-b border-offwhite last:border-0">
                                                    <td className="py-3 text-sm">{title}</td>
                                                    <td className="py-3 font-bold text-sm">{count}</td>
                                                </tr>
                                            ))
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editing ? 'Edit Book' : 'Add New Book'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-charcoal/40 hover:text-charcoal">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Book Title</label>
                <input 
                  placeholder="e.g. Atomic Habits" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Author Name</label>
                <input 
                  placeholder="e.g. James Clear" 
                  value={formData.author} 
                  onChange={e => setFormData({...formData, author: e.target.value})} 
                  className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal/70 mb-1">Selling Price (₦)</label>
                  <input 
                    type="number"
                    placeholder="0" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal/70 mb-1">Cost Price (₦)</label>
                  <input 
                    type="number"
                    placeholder="0" 
                    value={formData.costPrice} 
                    onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} 
                    className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                    min="0"
                  />
                </div>
              </div>
              
              {formData.price && formData.costPrice ? (
                 <div className="text-sm px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                    Expected Profit: ₦{(Number(formData.price) - Number(formData.costPrice)).toLocaleString()}
                 </div>
              ) : null}

              <div>
                  <label className="block text-sm font-medium text-charcoal/70 mb-1">Stock Quantity</label>
                  <input 
                    type="number"
                    placeholder="1" 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                    className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                    required
                    min="0"
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-charcoal/50 mt-1">Don't see a category? Add it in the 'Categories' tab.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Cover Image</label>
                <div className="flex flex-col gap-3">
                    <span className="text-xs text-charcoal/60">Option 1: Upload File</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload} 
                      disabled={uploading}
                      className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
                    />
                    {uploading && <span className="text-sm text-terracotta animate-pulse">Uploading to server... please wait.</span>}
                    
                    <span className="text-xs text-charcoal/60 mt-2">Option 2: Image URL</span>
                    <input 
                         type="url"
                         placeholder="https://example.com/image.jpg"
                         value={formData.coverUrl}
                         onChange={e => setFormData({...formData, coverUrl: e.target.value})}
                         className="w-full p-3 border border-beige rounded-xl focus:outline-none focus:border-terracotta"
                    />

                    {formData.coverUrl && (
                        <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-beige shadow-sm mt-2">
                            <img src={formData.coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                onClick={() => setFormData(prev => ({...prev, coverUrl: ''}))}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 border border-beige rounded-xl hover:bg-offwhite transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 py-3 bg-terracotta text-white rounded-xl shadow-soft hover:shadow-lg transition-all disabled:opacity-50">
                    {uploading ? 'Uploading...' : (editing ? 'Update Book' : 'Create Book')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isMeetingFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingMeeting ? 'Edit Event' : 'Schedule Event'}</h3>
                <button onClick={() => setIsMeetingFormOpen(false)} className="text-charcoal/40 hover:text-charcoal">✕</button>
            </div>
            
            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Event Title</label>
                <input 
                  required
                  value={meetingForm.title}
                  onChange={e => setMeetingForm({...meetingForm, title: e.target.value})}
                  className="w-full p-3 border border-beige rounded-xl"
                  placeholder="e.g. Monthly Book Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">Date</label>
                    <input 
                        type="date"
                        required
                        value={meetingForm.date}
                        onChange={e => setMeetingForm({...meetingForm, date: e.target.value})}
                        className="w-full p-3 border border-beige rounded-xl"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">Time</label>
                    <input 
                        type="time"
                        required
                        value={meetingForm.time}
                        onChange={e => setMeetingForm({...meetingForm, time: e.target.value})}
                        className="w-full p-3 border border-beige rounded-xl"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Location</label>
                <input 
                  required
                  value={meetingForm.location}
                  onChange={e => setMeetingForm({...meetingForm, location: e.target.value})}
                  className="w-full p-3 border border-beige rounded-xl"
                  placeholder="e.g. Google Meet Link or Physical Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Type</label>
                <select 
                    value={meetingForm.type}
                    onChange={e => setMeetingForm({...meetingForm, type: e.target.value as any})}
                    className="w-full p-3 border border-beige rounded-xl bg-white"
                >
                    <option value="discussion">Book Discussion</option>
                    <option value="event">Social Event</option>
                    <option value="meetup">Meetup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Meeting Link (Optional)</label>
                <input 
                  value={meetingForm.meetingLink || ''}
                  onChange={e => setMeetingForm({...meetingForm, meetingLink: e.target.value})}
                  className="w-full p-3 border border-beige rounded-xl"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  value={meetingForm.description}
                  onChange={e => setMeetingForm({...meetingForm, description: e.target.value})}
                  className="w-full p-3 border border-beige rounded-xl"
                  placeholder="What will happen at this event?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Linked Book (Optional)</label>
                <select 
                    value={meetingForm.bookId || ''}
                    onChange={e => {
                        const book = books.find(b => b.id === e.target.value)
                        setMeetingForm({
                            ...meetingForm, 
                            bookId: e.target.value,
                            bookTitle: book?.title
                        })
                    }}
                    className="w-full p-3 border border-beige rounded-xl bg-white"
                >
                    <option value="">None</option>
                    {books.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsMeetingFormOpen(false)} className="flex-1 p-3 rounded-xl border border-beige text-charcoal/60">Cancel</button>
                <button type="submit" className="flex-1 p-3 rounded-xl bg-terracotta text-white font-medium">{editingMeeting ? 'Save Changes' : 'Schedule Event'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
