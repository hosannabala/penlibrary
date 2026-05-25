'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { addBookAction, updateBookAction, deleteBookAction, addCategoryAction, deleteCategoryAction, bulkAddBooksAction, type BulkImportResult } from '../actions/books'
import { getSettingsAction, updateAllSettingsAction } from '../actions/settings'
import type { SiteSettings } from '../../lib/settings'
import { DEFAULT_SETTINGS } from '../../lib/settings'
import { useAuth } from '../../context/AuthContext'
import type { Book, Order, Category, ClubMeeting } from '../../lib/types'
import type { BookRequest } from '../../lib/requests'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isAdmin } from '../../lib/admin'
import { checkAdminStatus, addAdmin, removeAdmin, getAdmins } from '../actions/admin'
import { loginAdminAction, logoutAdminAction } from '../actions/auth'
import { supabase } from '../../lib/supabase'
import {
  getAllBooksAction,
  getAllCategoriesAction,
  getAllMeetingsAction,
  getGalleryAction,
  getAllOrdersAction,
  getAllRequestsAction,
  updateOrderStatusAction,
  updateRequestStatusAction,
  addMeetingAction,
  updateMeetingAction,
  deleteMeetingAction,
  addGalleryItemAction,
  deleteGalleryItemAction,
  getAdminUsersAction,
  type AdminUser,
} from '../actions/admin-data'

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: string; type: 'success' | 'error'; message: string }

function ToastList({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`flex items-center gap-3 px-4 py-3 shadow-lg max-w-xs w-full pointer-events-auto ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <span className="text-sm font-bold">{t.type === 'success' ? '✓' : '!'}</span>
            <span className="flex-1 text-sm font-medium leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white shrink-0">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

type ConfirmState = { open: boolean; message: string; onConfirm: () => void }

function ConfirmDialog({ state, dismiss }: { state: ConfirmState; dismiss: () => void }) {
  if (!state.open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-6 max-w-sm w-full shadow-xl"
      >
        <p className="text-charcoal font-medium mb-6 leading-relaxed">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={dismiss}
            className="px-5 py-2 border border-beige text-charcoal/70 font-bold text-xs uppercase tracking-wide hover:bg-offwhite transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { state.onConfirm(); dismiss() }}
            className="px-5 py-2 bg-red-600 text-white font-bold text-xs uppercase tracking-wide hover:bg-red-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_BOOK: Partial<Book> = {
  title: '', author: '', price: 0, salePrice: undefined, costPrice: 0,
  category: '', stock: 1, coverUrl: '', featured: false, preOrder: false, bestSeller: false,
}

const INITIAL_MEETING: Partial<ClubMeeting> = {
  title: '', date: '', time: '', location: '', description: '', type: 'discussion', meetingLink: '',
}

type Tab = 'books' | 'orders' | 'gallery' | 'requests' | 'categories' | 'club' | 'analytics' | 'admins' | 'settings' | 'users'

const TABS: { key: Tab; label: string }[] = [
  { key: 'books', label: 'Inventory' },
  { key: 'orders', label: 'Orders' },
  { key: 'requests', label: 'Requests' },
  { key: 'categories', label: 'Categories' },
  { key: 'club', label: 'Events' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'users', label: 'Users' },
  { key: 'admins', label: 'Admins' },
  { key: 'settings', label: 'Settings' },
]

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Auth
  const [adminChecking, setAdminChecking] = useState(true)
  const [isRealAdmin, setIsRealAdmin] = useState(false)

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }
  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  // Confirm
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '', onConfirm: () => {} })
  const showConfirm = (message: string, onConfirm: () => void) =>
    setConfirmState({ open: true, message, onConfirm })
  const dismissConfirm = () => setConfirmState(prev => ({ ...prev, open: false }))

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('books')

  // Data
  const [books, setBooks] = useState<Book[]>([])
  const [gallery, setGallery] = useState<{ id: string; url: string; title?: string }[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [adminList, setAdminList] = useState<any[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')

  // Book state
  const [bookSearch, setBookSearch] = useState('')
  const [editing, setEditing] = useState<Book | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<Partial<Book>>(INITIAL_BOOK)

  // Category state
  const [newCategory, setNewCategory] = useState('')
  const [catSaving, setCatSaving] = useState(false)

  // Meeting state
  const [meetingForm, setMeetingForm] = useState<Partial<ClubMeeting>>(INITIAL_MEETING)
  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ClubMeeting | null>(null)
  const [meetingSaving, setMeetingSaving] = useState(false)

  // Gallery state
  const [galleryUrl, setGalleryUrl] = useState('')
  const [galleryTitle, setGalleryTitle] = useState('')
  const [gallerySaving, setGallerySaving] = useState(false)

  // Admin state
  const [adminSaving, setAdminSaving] = useState(false)

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  // Per-row action spinner
  const [actionId, setActionId] = useState<string | null>(null)

  // Report dropdown
  const [showReportMenu, setShowReportMenu] = useState(false)
  const reportMenuRef = useRef<HTMLDivElement>(null)

  // Bulk CSV upload
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<{ rowNum: number; book: Omit<Book, 'id'>; valid: boolean; error?: string }[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkImportResult | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // ─── Admin check ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/'); return }

    async function verifyAdmin() {
      try {
        const isValid = await checkAdminStatus(user!.email)
        if (!isValid && !isAdmin(user!.email)) { router.replace('/'); return }

        // Establish signed server-side session so admin server actions work
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await loginAdminAction(session.access_token)
        }

        setIsRealAdmin(true)
      } catch {
        router.replace('/')
      } finally {
        setAdminChecking(false)
      }
    }

    verifyAdmin()
  }, [user, authLoading, router])

  // Clear admin session cookie when user signs out
  useEffect(() => {
    if (!user && !authLoading) {
      logoutAdminAction().catch(() => {})
    }
  }, [user, authLoading])

  // ─── Fetch all data ─────────────────────────────────────────────────────────
  async function fetchData() {
    setLoading(true)
    const [booksRes, galleryRes, requestsRes, categoriesRes, meetingsRes, ordersRes] = await Promise.allSettled([
      getAllBooksAction(),
      getGalleryAction(),
      getAllRequestsAction(),
      getAllCategoriesAction(),
      getAllMeetingsAction(),
      getAllOrdersAction(),
    ])

    if (booksRes.status === 'fulfilled') setBooks(booksRes.value)
    else console.error('Books fetch failed:', booksRes.reason)

    if (galleryRes.status === 'fulfilled') setGallery(galleryRes.value)
    else console.error('Gallery fetch failed:', galleryRes.reason)

    if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value)
    else console.error('Requests fetch failed:', requestsRes.reason)

    if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value)
    else console.error('Categories fetch failed:', categoriesRes.reason)

    if (meetingsRes.status === 'fulfilled') setMeetings(meetingsRes.value)
    else console.error('Meetings fetch failed:', meetingsRes.reason)

    if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value)
    else console.error('Orders fetch failed:', ordersRes.reason)

    const anyFailed = [booksRes, galleryRes, requestsRes, categoriesRes, meetingsRes, ordersRes].some(r => r.status === 'rejected')
    if (anyFailed) addToast('error', 'Some sections failed to load — check the browser console for details.')

    setLoading(false)
  }

  useEffect(() => {
    if (!isRealAdmin) return
    fetchData()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [isRealAdmin])

  useEffect(() => {
    if (activeTab === 'admins') fetchAdmins()
    if (activeTab === 'settings') {
      getSettingsAction().then(setSiteSettings).catch(() => {})
    }
    if (activeTab === 'users') {
      setUsersLoading(true)
      getAdminUsersAction().then(setAdminUsers).catch(() => {}).finally(() => setUsersLoading(false))
    }
  }, [activeTab])

  // Close report menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setShowReportMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Admins ──────────────────────────────────────────────────────────────────
  async function fetchAdmins() {
    const data = await getAdmins()
    const all = [
      ...data.legacyAdmins,
      ...data.firestoreAdmins.map((a: any) => ({ ...a, type: a.type ?? 'delegated' })),
    ]
    const unique = Array.from(new Map(all.map((a: any) => [a.email, a])).values())
    setAdminList(unique)
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!newAdminEmail) return
    setAdminSaving(true)
    try {
      const res = await addAdmin(newAdminEmail, user?.email || 'unknown')
      addToast(res.success ? 'success' : 'error', res.message)
      if (res.success) { setNewAdminEmail(''); fetchAdmins() }
    } catch {
      addToast('error', 'Failed to add admin.')
    } finally {
      setAdminSaving(false)
    }
  }

  async function handleRemoveAdmin(email: string) {
    showConfirm(`Remove ${email} from admins? They will lose dashboard access immediately.`, async () => {
      try {
        const res = await removeAdmin(email)
        addToast(res.success ? 'success' : 'error', res.success ? 'Admin removed.' : res.message)
        if (res.success) fetchAdmins()
      } catch {
        addToast('error', 'Failed to remove admin.')
      }
    })
  }

  // ─── Site Settings ───────────────────────────────────────────────────────────
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      await updateAllSettingsAction(siteSettings)
      addToast('success', 'Settings saved. Changes are live across the site.')
    } catch {
      addToast('error', 'Failed to save settings.')
    } finally {
      setSettingsSaving(false)
    }
  }

  // ─── Books ───────────────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setFormData(prev => ({ ...prev, coverUrl: data.url }))
    } catch (error: any) {
      addToast('error', error.message || 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await updateBookAction(editing.id, formData)
        addToast('success', `"${formData.title}" updated.`)
      } else {
        await addBookAction(formData as Omit<Book, 'id'>)
        addToast('success', `"${formData.title}" added to inventory.`)
      }
      setIsFormOpen(false)
      setEditing(null)
      setFormData(INITIAL_BOOK)
      fetchData()
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to save book.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(book: Book) {
    setEditing(book)
    setFormData(book)
    setIsFormOpen(true)
  }

  async function handleDelete(id: string, title: string) {
    showConfirm(`Delete "${title}" from inventory? This cannot be undone.`, async () => {
      setActionId(id)
      try {
        await deleteBookAction(id)
        addToast('success', `"${title}" deleted.`)
        fetchData()
      } catch {
        addToast('error', 'Failed to delete book.')
      } finally {
        setActionId(null)
      }
    })
  }

  async function handleQuickToggle(book: Book, field: 'featured' | 'preOrder' | 'bestSeller') {
    const newVal = !book[field]
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, [field]: newVal } : b))
    try {
      await updateBookAction(book.id, { [field]: newVal })
    } catch {
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, [field]: book[field] } : b))
      addToast('error', 'Failed to update book.')
    }
  }

  // ─── Categories ──────────────────────────────────────────────────────────────
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    setCatSaving(true)
    try {
      await addCategoryAction(newCategory.trim())
      addToast('success', `Category "${newCategory.trim()}" added.`)
      setNewCategory('')
      const updated = await getAllCategoriesAction()
      setCategories(updated)
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to add category.')
    } finally {
      setCatSaving(false)
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    showConfirm(`Delete category "${name}"? Books assigned to this category will have their category cleared.`, async () => {
      try {
        await deleteCategoryAction(id)
        addToast('success', `Category "${name}" deleted.`)
        const updated = await getAllCategoriesAction()
        setCategories(updated)
      } catch {
        addToast('error', 'Failed to delete category.')
      }
    })
  }

  // ─── Club Meetings ───────────────────────────────────────────────────────────
  async function handleAddMeeting(e: React.FormEvent) {
    e.preventDefault()
    setMeetingSaving(true)
    try {
      if (editingMeeting) {
        await updateMeetingAction(editingMeeting.id, meetingForm as Partial<ClubMeeting>)
        addToast('success', 'Event updated.')
      } else {
        await addMeetingAction(meetingForm as Omit<ClubMeeting, 'id'>)
        addToast('success', 'Event scheduled.')
      }
      setIsMeetingFormOpen(false)
      setEditingMeeting(null)
      setMeetingForm(INITIAL_MEETING)
      const updated = await getAllMeetingsAction()
      setMeetings(updated)
    } catch (error: any) {
      addToast('error', error?.message || 'Failed to save event.')
    } finally {
      setMeetingSaving(false)
    }
  }

  async function handleDeleteMeeting(id: string, title: string) {
    showConfirm(`Cancel the event "${title}"?`, async () => {
      setActionId(id)
      try {
        await deleteMeetingAction(id)
        addToast('success', 'Event cancelled.')
        const updated = await getAllMeetingsAction()
        setMeetings(updated)
      } catch {
        addToast('error', 'Failed to cancel event.')
      } finally {
        setActionId(null)
      }
    })
  }

  // ─── Gallery ─────────────────────────────────────────────────────────────────
  async function handleAddGallery(e: React.FormEvent) {
    e.preventDefault()
    if (!galleryUrl) return
    setGallerySaving(true)
    try {
      await addGalleryItemAction(galleryUrl, galleryTitle || undefined)
      addToast('success', 'Image added to gallery.')
      setGalleryUrl('')
      setGalleryTitle('')
      fetchData()
    } catch {
      addToast('error', 'Failed to add image.')
    } finally {
      setGallerySaving(false)
    }
  }

  async function handleDeleteGallery(id: string) {
    showConfirm('Remove this image from the gallery?', async () => {
      setActionId(id)
      try {
        await deleteGalleryItemAction(id)
        addToast('success', 'Image removed.')
        fetchData()
      } catch {
        addToast('error', 'Failed to remove image.')
      } finally {
        setActionId(null)
      }
    })
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────
  async function handleOrderStatus(order: Order, status: Order['status']) {
    setActionId(order.id)
    try {
      await updateOrderStatusAction(order.id, status)
      addToast('success', `Order #${order.id.slice(0, 8)} marked as ${status}.`)
      const updated = await getAllOrdersAction()
      setOrders(updated)
    } catch {
      addToast('error', 'Failed to update order.')
    } finally {
      setActionId(null)
    }
  }

  // ─── Requests ────────────────────────────────────────────────────────────────
  async function handleRequestStatus(id: string, status: BookRequest['status']) {
    setActionId(id)
    try {
      await updateRequestStatusAction(id, status)
      addToast('success', `Request marked as ${status}.`)
      const updated = await getAllRequestsAction()
      setRequests(updated)
    } catch {
      addToast('error', 'Failed to update request.')
    } finally {
      setActionId(null)
    }
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────
  function downloadInventoryCSV() {
    const headers = ['ID', 'Title', 'Author', 'Price', 'Stock', 'Category']
    const rows = books.map(b => [b.id, b.title, b.author, b.price, b.stock, b.category])
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const a = document.createElement('a')
    a.href = encodeURI(csv)
    a.download = 'inventory_report.csv'
    a.click()
  }

  function downloadInventoryPDF() {
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(240, 122, 34); doc.text('Pen Library Services', 14, 20)
    doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text('Inventory Report', 14, 30)
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
    autoTable(doc, {
      head: [['Title', 'Author', 'Price', 'Stock', 'Category']],
      body: books.map(b => [b.title, b.author, b.price, b.stock, b.category]),
      startY: 45, headStyles: { fillColor: [240, 122, 34] },
    })
    doc.save('inventory_report.pdf')
  }

  function downloadPurchaseList() {
    const stats: Record<string, { title: string; sold: number; stock: number }> = {}
    orders.forEach(o => o.items.forEach(i => {
      if (!stats[i.book.id]) stats[i.book.id] = { title: i.book.title, sold: 0, stock: i.book.stock }
      stats[i.book.id].sold += i.quantity
    }))
    const rows = Object.values(stats).sort((a, b) => b.sold - a.sold).map(b => [b.title, b.sold, b.stock])
    const csv = 'data:text/csv;charset=utf-8,' + [['Book Title', 'Total Sold', 'Current Stock'].join(','), ...rows.map(r => r.join(','))].join('\n')
    const a = document.createElement('a'); a.href = encodeURI(csv); a.download = 'sales_report.csv'; a.click()
  }

  function downloadPurchaseListPDF() {
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(240, 122, 34); doc.text('Pen Library Services', 14, 20)
    doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text('Sales Report', 14, 30)
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
    const stats: Record<string, { title: string; sold: number; stock: number }> = {}
    orders.forEach(o => o.items.forEach(i => {
      if (!stats[i.book.id]) stats[i.book.id] = { title: i.book.title, sold: 0, stock: i.book.stock }
      stats[i.book.id].sold += i.quantity
    }))
    autoTable(doc, {
      head: [['Book Title', 'Total Sold', 'Current Stock']],
      body: Object.values(stats).sort((a, b) => b.sold - a.sold).map(b => [b.title, b.sold, b.stock]),
      startY: 45, headStyles: { fillColor: [240, 122, 34] },
    })
    doc.save('sales_report.pdf')
  }

  function downloadRequestsCSV() {
    const stats: Record<string, number> = {}
    requests.forEach(r => { const k = `${r.bookTitle} by ${r.author}`; stats[k] = (stats[k] || 0) + 1 })
    const csv = 'data:text/csv;charset=utf-8,' + [['Book Title', 'Request Count'].join(','), ...Object.entries(stats).sort(([, a], [, b]) => b - a).map(r => r.join(','))].join('\n')
    const a = document.createElement('a'); a.href = encodeURI(csv); a.download = 'requests_report.csv'; a.click()
  }

  function downloadRequestsPDF() {
    const doc = new jsPDF()
    doc.setFontSize(22); doc.setTextColor(240, 122, 34); doc.text('Pen Library Services', 14, 20)
    doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text('Requests Report', 14, 30)
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
    const stats: Record<string, number> = {}
    requests.forEach(r => { const k = `${r.bookTitle} by ${r.author}`; stats[k] = (stats[k] || 0) + 1 })
    autoTable(doc, {
      head: [['Book Title', 'Request Count']],
      body: Object.entries(stats).sort(([, a], [, b]) => b - a),
      startY: 45, headStyles: { fillColor: [240, 122, 34] },
    })
    doc.save('requests_report.pdf')
  }

  // ─── Bulk CSV Upload ─────────────────────────────────────────────────────────

  function downloadCSVTemplate() {
    const headers = 'title,author,price,sale_price,cost_price,category,cover_url,description,stock,featured,pre_order,best_seller'
    const example = '"Atomic Habits","James Clear","5000","","4000","Non-Fiction","https://example.com/cover.jpg","Build good habits and break bad ones.","10","false","false","false"'
    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, example].join('\n'))
    const a = document.createElement('a')
    a.href = csv
    a.download = 'book_import_template.csv'
    a.click()
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBulkResult(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseBool = (v: string) => v?.toLowerCase() === 'true' || v === '1' || v?.toLowerCase() === 'yes'
        const parseOptNum = (v: string) => (!v || v.trim() === '') ? undefined : Number(v)
        const rows = (results.data as any[]).map((row, i) => {
          const rowNum = i + 2
          const title = row.title?.trim()
          const author = row.author?.trim()
          const price = Number(row.price)
          const stock = parseInt(row.stock, 10)
          if (!title) return { rowNum, book: {} as Omit<Book, 'id'>, valid: false, error: 'Missing title' }
          if (!author) return { rowNum, book: {} as Omit<Book, 'id'>, valid: false, error: 'Missing author' }
          if (!row.price || isNaN(price) || price <= 0) return { rowNum, book: {} as Omit<Book, 'id'>, valid: false, error: 'Invalid price' }
          if (row.stock === '' || row.stock == null || isNaN(stock) || stock < 0) return { rowNum, book: {} as Omit<Book, 'id'>, valid: false, error: 'Invalid stock' }
          const book: Omit<Book, 'id'> = {
            title, author, price, stock,
            salePrice: parseOptNum(row.sale_price),
            costPrice: parseOptNum(row.cost_price),
            category: row.category?.trim() || '',
            coverUrl: row.cover_url?.trim() || undefined,
            description: row.description?.trim() || undefined,
            featured: parseBool(row.featured),
            preOrder: parseBool(row.pre_order),
            bestSeller: parseBool(row.best_seller),
          }
          return { rowNum, book, valid: true }
        })
        setCsvPreview(rows)
      },
      error: () => addToast('error', 'Could not read the CSV file. Make sure it is a valid .csv file.'),
    })
  }

  async function handleBulkImport() {
    const validRows = csvPreview.filter(r => r.valid).map(r => r.book)
    if (validRows.length === 0) return
    setBulkUploading(true)
    try {
      const result = await bulkAddBooksAction(validRows)
      setBulkResult(result)
      fetchData()
      if (csvInputRef.current) csvInputRef.current.value = ''
      setCsvPreview([])
    } catch (error: any) {
      addToast('error', error?.message || 'Bulk import failed.')
    } finally {
      setBulkUploading(false)
    }
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const totalValue = books.reduce((acc, b) => acc + b.price * b.stock, 0)
  const totalStock = books.reduce((acc, b) => acc + b.stock, 0)
  const lowStockCount = books.filter(b => b.stock < 3).length
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0)
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const filteredBooks = books.filter(
    b =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase())
  )

  // ─── Early returns ────────────────────────────────────────────────────────────
  if (authLoading || adminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="font-bold text-charcoal text-lg">Verifying access...</p>
          <p className="text-sm text-charcoal/50 mt-1">Please wait</p>
        </div>
      </div>
    )
  }
  if (!user || !isRealAdmin) return null

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    fulfilled: 'bg-green-100 text-green-700',
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="py-8">
      <ToastList toasts={toasts} dismiss={dismissToast} />
      <ConfirmDialog state={confirmState} dismiss={dismissConfirm} />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Admin Dashboard</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">Signed in as {user.email}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 border border-beige text-charcoal/70 font-bold text-xs uppercase tracking-wide hover:bg-offwhite transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? '...' : '↺ Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-[#EBEBEB] p-5 bg-white">
          <p className="text-xs text-charcoal/50 font-medium uppercase tracking-wide mb-1">Revenue</p>
          <p className="text-2xl font-bold text-terracotta">₦{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-charcoal/40 mt-1">{orders.length} orders</p>
        </div>
        <div className="border border-[#EBEBEB] p-5 bg-white">
          <p className="text-xs text-charcoal/50 font-medium uppercase tracking-wide mb-1">Inventory Value</p>
          <p className="text-2xl font-bold text-charcoal">₦{totalValue.toLocaleString()}</p>
          <p className="text-xs text-charcoal/40 mt-1">{books.length} titles</p>
        </div>
        <div className="border border-[#EBEBEB] p-5 bg-white">
          <p className="text-xs text-charcoal/50 font-medium uppercase tracking-wide mb-1">Books in Stock</p>
          <p className="text-2xl font-bold text-charcoal">{totalStock}</p>
          {lowStockCount > 0 && <p className="text-xs text-red-500 font-semibold mt-1">{lowStockCount} low stock</p>}
        </div>
        <div className="border border-[#EBEBEB] p-5 bg-white">
          <p className="text-xs text-charcoal/50 font-medium uppercase tracking-wide mb-1">Pending Requests</p>
          <p className="text-2xl font-bold text-terracotta">{pendingRequests}</p>
          <p className="text-xs text-charcoal/40 mt-1">{requests.length} total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-beige mb-6 overflow-x-auto pb-0 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium shrink-0 transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-terracotta border-terracotta'
                : 'text-charcoal/60 border-transparent hover:text-charcoal'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Books Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'books' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
            <div className="flex gap-2">
              <input
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                placeholder="Search books..."
                className="px-3 py-2 border border-beige text-sm focus:outline-none focus:border-charcoal/40"
              />
              <button onClick={downloadInventoryCSV} className="px-3 py-2 border border-beige text-charcoal/70 hover:bg-offwhite text-xs font-bold uppercase tracking-wide transition-colors">
                CSV
              </button>
              <button onClick={downloadInventoryPDF} className="px-3 py-2 border border-beige text-charcoal/70 hover:bg-offwhite text-xs font-bold uppercase tracking-wide transition-colors">
                PDF
              </button>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={() => { setIsBulkOpen(true); setBulkResult(null); setCsvPreview([]) }}
                className="px-5 py-2 border border-terracotta text-terracotta font-bold text-xs uppercase tracking-wide hover:bg-terracotta/5 transition-colors flex items-center gap-2"
              >
                ↑ Upload CSV
              </button>
              <button
                onClick={() => { setEditing(null); setFormData(INITIAL_BOOK); setIsFormOpen(true) }}
                className="px-5 py-2 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors flex items-center gap-2"
              >
                + Add Book
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-charcoal/50">Loading inventory...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-beige text-charcoal/50">
              {bookSearch ? `No books matching "${bookSearch}"` : 'No books yet. Add your first book.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-beige text-left">
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide">Book</th>
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide">Price</th>
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide">Stock</th>
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide">Category</th>
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide">Tags</th>
                    <th className="pb-3 font-medium text-charcoal/50 text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id} className="border-b border-beige/50 hover:bg-offwhite/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} className="w-8 h-11 object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-11 bg-beige shrink-0 flex items-center justify-center text-charcoal/30 text-xs">?</div>
                          )}
                          <div>
                            <p className="font-semibold text-charcoal">{book.title}</p>
                            <p className="text-charcoal/50 text-xs">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">₦{book.price.toLocaleString()}</p>
                        {book.salePrice && <p className="text-xs text-terracotta">Sale: ₦{book.salePrice.toLocaleString()}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-bold ${book.stock < 3 ? 'text-red-500' : 'text-charcoal'}`}>{book.stock}</span>
                        {book.stock < 3 && <p className="text-xs text-red-400">Low stock</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-charcoal/60 text-xs">{book.category || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleQuickToggle(book, 'featured')}
                            title="Toggle HOT tag"
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border transition-colors ${book.featured ? 'bg-orange-100 text-orange-700 border-orange-200' : 'border-beige text-charcoal/30 hover:border-orange-200 hover:text-orange-400'}`}
                          >
                            HOT
                          </button>
                          <button
                            onClick={() => handleQuickToggle(book, 'preOrder')}
                            title="Toggle Pre-Order tag"
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border transition-colors ${book.preOrder ? 'bg-blue-100 text-blue-700 border-blue-200' : 'border-beige text-charcoal/30 hover:border-blue-200 hover:text-blue-400'}`}
                          >
                            Pre-Order
                          </button>
                          <button
                            onClick={() => handleQuickToggle(book, 'bestSeller')}
                            title="Toggle Best Seller tag"
                            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border transition-colors ${book.bestSeller ? 'bg-green-100 text-green-700 border-green-200' : 'border-beige text-charcoal/30 hover:border-green-200 hover:text-green-400'}`}
                          >
                            Best Seller
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(book)}
                            className="px-3 py-1.5 bg-beige text-charcoal font-bold text-xs uppercase tracking-wide hover:bg-beige/70 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(book.id, book.title)}
                            disabled={actionId === book.id}
                            className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wide hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionId === book.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-charcoal/40 mt-3">{filteredBooks.length} of {books.length} books shown</p>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-charcoal/50">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-beige text-charcoal/50">
              No orders yet. Orders will appear here when customers check out.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="card p-5 bg-white">
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusColor[order.status] ?? 'bg-beige text-charcoal'}`}>
                          {order.status.toUpperCase()}
                        </span>
                        {order.paymentStatus === 'paid' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-green-50 text-green-600">PAID</span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal/50">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-terracotta">₦{order.total.toLocaleString()}</p>
                      {order.amountPaid && order.amountPaid !== order.total && (
                        <p className="text-xs text-charcoal/50">Paid: ₦{order.amountPaid.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-offwhite/60 border border-[#EBEBEB] p-3 text-sm">
                      <p className="font-semibold text-charcoal mb-1">Customer</p>
                      <p>{order.customerName || '—'}</p>
                      <p className="text-charcoal/60">{order.customerEmail || '—'}</p>
                      <p className="text-charcoal/60">{order.customerPhone || '—'}</p>
                    </div>
                    <div className="bg-offwhite/60 border border-[#EBEBEB] p-3 text-sm">
                      <p className="font-semibold text-charcoal mb-1">
                        {order.deliveryMethod === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                      </p>
                      <p className="text-charcoal/60">{order.address || 'At store'}</p>
                      {order.paymentReference && (
                        <p className="text-xs text-charcoal/40 mt-1">Ref: {order.paymentReference}</p>
                      )}
                    </div>
                  </div>

                  <div className="border border-beige overflow-hidden mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < order.items.length - 1 ? 'border-b border-beige' : ''}`}>
                        <span className="text-charcoal">{item.book.title} <span className="text-charcoal/50">×{item.quantity}</span></span>
                        <span className="font-medium">₦{(item.book.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleOrderStatus(order, 'processing')}
                          disabled={actionId === order.id}
                          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {actionId === order.id ? '...' : 'Mark Processing'}
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button
                          onClick={() => handleOrderStatus(order, 'shipped')}
                          disabled={actionId === order.id}
                          className="px-4 py-2 bg-purple-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          {actionId === order.id ? '...' : 'Mark Shipped'}
                        </button>
                      )}
                      <button
                        onClick={() => handleOrderStatus(order, 'delivered')}
                        disabled={actionId === order.id}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionId === order.id ? '...' : 'Mark Delivered'}
                      </button>
                      <button
                        onClick={() => handleOrderStatus(order, 'cancelled')}
                        disabled={actionId === order.id}
                        className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {actionId === order.id ? '...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Requests Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-charcoal/50">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-beige text-charcoal/50">
              No book requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="card p-4 flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <p className="font-bold text-charcoal">{req.bookTitle}</p>
                    <p className="text-sm text-charcoal/60">by {req.author}</p>
                    <p className="text-xs text-charcoal/40 mt-1">
                      Requested by <span className="font-medium">{req.userName}</span> · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor[req.status] ?? 'bg-beige text-charcoal'}`}>
                      {req.status.toUpperCase()}
                    </span>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestStatus(req.id, 'fulfilled')}
                          disabled={actionId === req.id}
                          className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold uppercase tracking-wide hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {actionId === req.id ? '...' : 'Fulfilled'}
                        </button>
                        <button
                          onClick={() => handleRequestStatus(req.id, 'cancelled')}
                          disabled={actionId === req.id}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionId === req.id ? '...' : 'Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Categories Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="max-w-2xl">
          <div className="border border-[#EBEBEB] p-6 mb-6 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Add Category</h3>
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <input
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                placeholder="e.g. Science Fiction"
                className="flex-1 p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
              />
              <button
                type="submit"
                disabled={catSaving}
                className="px-5 py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {catSaving ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          {categories.length === 0 ? (
            <p className="text-charcoal/50 text-sm">No categories yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="border border-[#EBEBEB] p-4 flex justify-between items-center bg-white">
                  <span className="font-medium text-charcoal">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="text-xs text-red-500 font-bold uppercase tracking-wide hover:text-red-700 transition-colors px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Events Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'club' && (
        <div className="max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Upcoming Events</h3>
            <button
              onClick={() => { setEditingMeeting(null); setMeetingForm(INITIAL_MEETING); setIsMeetingFormOpen(true) }}
              className="px-4 py-2 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors"
            >
              + Schedule Event
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-beige text-charcoal/50">
              No events scheduled yet.
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map(meeting => (
                <div key={meeting.id} className="card p-5 bg-white flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 flex flex-col items-center justify-center bg-offwhite p-3 w-16 border border-beige text-center">
                      <span className="text-xs font-bold text-terracotta uppercase">{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-2xl font-bold text-charcoal leading-none">{new Date(meeting.date).getDate()}</span>
                      {meeting.time && <span className="text-xs text-charcoal/50 mt-0.5">{meeting.time}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          meeting.type === 'discussion' ? 'bg-blue-100 text-blue-700' :
                          meeting.type === 'event' ? 'bg-purple-100 text-purple-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {meeting.type.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-bold text-charcoal">{meeting.title}</h4>
                      {meeting.description && <p className="text-sm text-charcoal/60 mt-1">{meeting.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-charcoal/50">
                        {meeting.location && <span>📍 {meeting.location}</span>}
                        {meeting.bookTitle && <span>📖 {meeting.bookTitle}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => { setEditingMeeting(meeting); setMeetingForm(meeting); setIsMeetingFormOpen(true) }}
                      className="px-3 py-1.5 bg-beige text-charcoal text-xs font-bold uppercase tracking-wide hover:bg-beige/70 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                      disabled={actionId === meeting.id}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wide hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {actionId === meeting.id ? '...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Gallery Tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div>
          <form onSubmit={handleAddGallery} className="card p-5 mb-6 bg-white flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Image URL</label>
              <input
                value={galleryUrl}
                onChange={e => setGalleryUrl(e.target.value)}
                className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Caption (optional)</label>
              <input
                value={galleryTitle}
                onChange={e => setGalleryTitle(e.target.value)}
                className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                placeholder="Event description..."
              />
            </div>
            <button
              type="submit"
              disabled={gallerySaving}
              className="px-5 py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50 shrink-0"
            >
              {gallerySaving ? 'Adding...' : 'Add Image'}
            </button>
          </form>

          {gallery.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-beige text-charcoal/50">
              No gallery images yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map(item => (
                <div key={item.id} className="relative group aspect-square overflow-hidden rounded-xl">
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteGallery(item.id)}
                      disabled={actionId === item.id}
                      className="bg-red-500 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionId === item.id ? '...' : 'Remove'}
                    </button>
                  </div>
                  {item.title && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-2 truncate">{item.title}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Analytics Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Sales Performance</h3>
            <div className="relative" ref={reportMenuRef}>
              <button
                onClick={() => setShowReportMenu(v => !v)}
                className="bg-terracotta text-white px-5 py-2 font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors flex items-center gap-2"
              >
                Download Reports
                <svg className={`w-4 h-4 transition-transform ${showReportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showReportMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-lg border border-beige py-2 z-10">
                  <p className="px-4 py-1.5 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Inventory</p>
                  <button onClick={() => { downloadInventoryCSV(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Inventory (CSV)</button>
                  <button onClick={() => { downloadInventoryPDF(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Inventory (PDF)</button>
                  <div className="border-t border-beige my-1" />
                  <p className="px-4 py-1.5 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Sales</p>
                  <button onClick={() => { downloadPurchaseList(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Sales Report (CSV)</button>
                  <button onClick={() => { downloadPurchaseListPDF(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Sales Report (PDF)</button>
                  <div className="border-t border-beige my-1" />
                  <p className="px-4 py-1.5 text-xs font-bold text-charcoal/40 uppercase tracking-wider">Requests</p>
                  <button onClick={() => { downloadRequestsCSV(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Requests (CSV)</button>
                  <button onClick={() => { downloadRequestsPDF(); setShowReportMenu(false) }} className="w-full text-left px-4 py-2 hover:bg-offwhite text-sm text-charcoal">Requests (PDF)</button>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 bg-white">
            <h4 className="font-semibold mb-4 text-sm text-charcoal/70 uppercase tracking-wide">Daily Sales (Last 7 Days)</h4>
            {orders.length === 0 ? (
              <div className="h-64 flex items-center justify-center border border-dashed border-beige text-charcoal/40 text-sm">
                No orders yet — charts appear once sales come in.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const daily: Record<string, number> = {}
                    orders.forEach(o => {
                      const d = new Date(o.createdAt ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      daily[d] = (daily[d] || 0) + o.total
                    })
                    return Object.entries(daily).map(([date, total]) => ({ date, total })).slice(-7)
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} tickFormatter={v => `₦${v / 1000}k`} />
                    <Tooltip
                      cursor={{ fill: '#F5F5F0' }}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                      formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, 'Sales']}
                    />
                    <Bar dataKey="total" fill="#F07A22" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6 bg-white">
              <h4 className="font-semibold mb-4 text-sm text-charcoal/70 uppercase tracking-wide">Top Selling Books</h4>
              {orders.length === 0 ? (
                <p className="text-charcoal/40 text-sm">No sales data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-beige">
                      <th className="pb-2 font-medium text-charcoal/50 text-left text-xs">Book</th>
                      <th className="pb-2 font-medium text-charcoal/50 text-right text-xs">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const stats: Record<string, any> = {}
                      orders.forEach(o => o.items.forEach(i => {
                        if (!stats[i.book.id]) stats[i.book.id] = { ...i.book, sold: 0 }
                        stats[i.book.id].sold += i.quantity
                      }))
                      return Object.values(stats).sort((a, b) => b.sold - a.sold).slice(0, 5).map((b: any) => (
                        <tr key={b.id} className="border-b border-offwhite last:border-0">
                          <td className="py-2.5 pr-4 text-charcoal">{b.title}</td>
                          <td className="py-2.5 font-bold text-right">{b.sold}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card p-6 bg-white">
              <h4 className="font-semibold mb-4 text-sm text-charcoal/70 uppercase tracking-wide">Most Requested Books</h4>
              {requests.length === 0 ? (
                <p className="text-charcoal/40 text-sm">No requests yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-beige">
                      <th className="pb-2 font-medium text-charcoal/50 text-left text-xs">Book</th>
                      <th className="pb-2 font-medium text-charcoal/50 text-right text-xs">Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const stats: Record<string, number> = {}
                      requests.forEach(r => { const k = `${r.bookTitle} by ${r.author}`; stats[k] = (stats[k] || 0) + 1 })
                      return Object.entries(stats).sort(([, a], [, b]) => b - a).slice(0, 5).map(([title, count]) => (
                        <tr key={title} className="border-b border-offwhite last:border-0">
                          <td className="py-2.5 pr-4 text-charcoal">{title}</td>
                          <td className="py-2.5 font-bold text-right">{count}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Admins Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'admins' && (
        <div className="max-w-2xl">
          <div className="border border-[#EBEBEB] p-6 mb-6 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-1">Add Admin</h3>
            <p className="text-xs text-charcoal/50 mb-4">This person will have full access to this dashboard.</p>
            <form onSubmit={handleAddAdmin} className="flex gap-3">
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
              />
              <button
                type="submit"
                disabled={adminSaving}
                className="px-5 py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {adminSaving ? 'Adding...' : 'Add Admin'}
              </button>
            </form>
          </div>

          <div className="border border-[#EBEBEB] p-6 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-4">Current Admins</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-beige text-charcoal/50 text-xs uppercase tracking-wide">
                    <th className="pb-3 font-medium text-left">Email</th>
                    <th className="pb-3 font-medium text-left">Role</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map((admin, i) => (
                    <tr key={i} className="border-b border-beige/50 hover:bg-offwhite/50">
                      <td className="py-3 font-medium">{admin.email}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 font-bold ${
                          admin.type === 'system' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {admin.type === 'system' ? 'SYSTEM' : 'DELEGATED'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {admin.type !== 'system' && (
                          <button
                            onClick={() => handleRemoveAdmin(admin.email)}
                            className="text-xs text-red-500 font-bold uppercase tracking-wide hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Users Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold uppercase tracking-widest text-charcoal">Registered Users</h3>
              <p className="text-xs text-charcoal/40 mt-1">{adminUsers.length} user{adminUsers.length !== 1 ? 's' : ''} signed up</p>
            </div>
            <input
              type="text"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="border border-[#EBEBEB] px-4 py-2 text-sm focus:outline-none focus:border-charcoal/40 w-64"
            />
          </div>

          {usersLoading ? (
            <div className="py-16 text-center text-charcoal/40 text-sm">Loading users…</div>
          ) : adminUsers.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#EBEBEB]">
              <p className="text-charcoal/40 text-sm">No users have signed up yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#EBEBEB]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-charcoal/50">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-charcoal/50">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-charcoal/50">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-charcoal/50">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-charcoal/50">Last Sign In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {adminUsers
                    .filter(u => {
                      const q = userSearch.toLowerCase()
                      return !q || u.email.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3 font-medium text-charcoal">{u.displayName}</td>
                        <td className="px-4 py-3 text-charcoal/70">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-[#EBEBEB] text-charcoal/50">
                            {u.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-charcoal/50 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-charcoal/50 text-xs">
                          {u.lastSignIn
                            ? new Date(u.lastSignIn).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-5">

            <div className="border border-[#EBEBEB] p-6 bg-white">
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-5">Contact Details</h3>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Store Email</label>
                  <input
                    type="email"
                    value={siteSettings.email}
                    onChange={e => setSiteSettings(s => ({ ...s, email: e.target.value }))}
                    placeholder="penlibrary@email.com"
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">Shown in the top navigation bar and footer.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    value={siteSettings.phone}
                    onChange={e => setSiteSettings(s => ({ ...s, phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="2348000000000"
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm font-mono"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">Digits only, with country code — no +, spaces or dashes. Used for WhatsApp links and the contact page.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Store Address</label>
                  <input
                    type="text"
                    value={siteSettings.address}
                    onChange={e => setSiteSettings(s => ({ ...s, address: e.target.value }))}
                    placeholder="Okuru-Ama, Port Harcourt, Rivers State, Nigeria"
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">Shown in the footer and contact page.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Pickup Address</label>
                  <input
                    type="text"
                    value={siteSettings.pickup_address}
                    onChange={e => setSiteSettings(s => ({ ...s, pickup_address: e.target.value }))}
                    placeholder="Pen Library Services, Port Harcourt, Rivers State"
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">Shown to customers who choose free pickup at checkout.</p>
                </div>

              </div>
            </div>

            <div className="border border-[#EBEBEB] p-6 bg-white">
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-5">Announcement Bar</h3>
              <div>
                <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Top Banner Text</label>
                <input
                  type="text"
                  value={siteSettings.announcement_bar}
                  onChange={e => setSiteSettings(s => ({ ...s, announcement_bar: e.target.value }))}
                  placeholder="Free delivery on orders over ₦20,000 · Nationwide shipping across Nigeria"
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                />
                <p className="text-xs text-charcoal/40 mt-1">Shown in the navy bar at the top of every page. Clear it to hide the bar.</p>
              </div>
            </div>

            <div className="border border-[#EBEBEB] p-6 bg-white">
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-5">Social & Community</h3>
              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">Instagram URL</label>
                  <input
                    type="url"
                    value={siteSettings.instagram_url}
                    onChange={e => setSiteSettings(s => ({ ...s, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/pen_library_services"
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">WhatsApp Community Link</label>
                  <input
                    type="url"
                    value={siteSettings.whatsapp_community_url}
                    onChange={e => setSiteSettings(s => ({ ...s, whatsapp_community_url: e.target.value }))}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">The &quot;Join WhatsApp&quot; button on the Book Club page.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1.5">WhatsApp Group Link <span className="font-normal normal-case text-charcoal/30">— optional</span></label>
                  <input
                    type="url"
                    value={siteSettings.whatsapp_group_url}
                    onChange={e => setSiteSettings(s => ({ ...s, whatsapp_group_url: e.target.value }))}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>

              </div>
            </div>

            <button
              type="submit"
              disabled={settingsSaving}
              className="w-full py-3.5 bg-terracotta text-white font-bold text-xs uppercase tracking-widest hover:bg-terracotta/90 transition-colors disabled:opacity-50"
            >
              {settingsSaving ? 'Saving…' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* ── Book Form Modal ───────────────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal">{editing ? 'Edit Book' : 'Add New Book'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-charcoal/40 hover:text-charcoal text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Title *</label>
                <input
                  placeholder="e.g. Atomic Habits"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Author *</label>
                <input
                  placeholder="e.g. James Clear"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Brief summary..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Selling Price (₦) *</label>
                  <input
                    type="number" min="0" required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Cost Price (₦)</label>
                  <input
                    type="number" min="0"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">
                  Sale Price (₦) <span className="normal-case font-normal text-charcoal/40">— optional, enables Deals section</span>
                </label>
                <input
                  type="number" min="0"
                  placeholder="Leave blank for no deal"
                  value={formData.salePrice ?? ''}
                  onChange={e => setFormData({ ...formData, salePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                />
              </div>

              {formData.price && formData.costPrice ? (
                <div className="text-sm px-3 py-2 bg-green-50 border border-green-100 text-green-700">
                  Profit margin: ₦{(Number(formData.price) - Number(formData.costPrice)).toLocaleString()} per unit
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Stock Quantity *</label>
                <input
                  type="number" min="0" required
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 bg-white text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
                <p className="text-xs text-charcoal/40 mt-1">Add new categories in the Categories tab.</p>
              </div>

              <div className="border-t border-[#EBEBEB] pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-charcoal/50 mb-3">Tags</p>
                <div className="space-y-2">
                  {([
                    { key: 'featured', label: 'HOT', description: 'Shows in Hot Picks section on homepage' },
                    { key: 'preOrder', label: 'Pre-Order', description: 'Book is not yet in stock — accepting advance orders' },
                    { key: 'bestSeller', label: 'Best Seller', description: 'Shows in Best Sellers section on homepage' },
                  ] as { key: keyof typeof formData; label: string; description: string }[]).map(({ key, label, description }) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={!!formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.checked })}
                        className="mt-0.5 w-4 h-4 accent-terracotta shrink-0"
                      />
                      <div>
                        <span className="text-sm font-semibold text-charcoal group-hover:text-terracotta transition-colors">{label}</span>
                        <p className="text-xs text-charcoal/40 leading-snug">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-2 uppercase tracking-wide">Cover Image</label>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-charcoal/50 mb-1">Upload file</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full p-2.5 border border-beige text-sm file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
                    />
                    {uploading && <p className="text-xs text-terracotta mt-1 animate-pulse">Uploading...</p>}
                  </div>
                  <div>
                    <p className="text-xs text-charcoal/50 mb-1">Or paste URL</p>
                    <input
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      value={formData.coverUrl}
                      onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                      className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                    />
                  </div>
                  {formData.coverUrl && (
                    <div className="relative w-20 h-28 overflow-hidden border border-beige shadow-sm">
                      <img src={formData.coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
                        className="absolute top-1 right-1 bg-black/60 text-white w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 border border-beige font-bold text-xs uppercase tracking-wide hover:bg-offwhite transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editing ? 'Update Book' : 'Add Book')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Bulk CSV Upload Modal ─────────────────────────────────────────────── */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Bulk Import Books</h3>
                <p className="text-xs text-charcoal/50 mt-0.5">Upload a CSV to add multiple books at once</p>
              </div>
              <button
                onClick={() => { setIsBulkOpen(false); setCsvPreview([]); setBulkResult(null) }}
                className="text-charcoal/40 hover:text-charcoal text-xl leading-none"
              >✕</button>
            </div>

            {/* Step 1 */}
            <div className="bg-offwhite border border-[#EBEBEB] p-4 mb-5">
              <p className="text-sm font-semibold text-charcoal mb-1">Step 1 — Download the template</p>
              <p className="text-xs text-charcoal/60 mb-3">
                Fill in one book per row. <strong>title</strong>, <strong>author</strong>, <strong>price</strong>, and <strong>stock</strong> are required.
                Paste image URLs in the <strong>cover_url</strong> column. Leave optional columns blank.
              </p>
              <button
                onClick={downloadCSVTemplate}
                className="px-4 py-2 bg-charcoal text-white text-xs font-bold uppercase tracking-wide hover:bg-charcoal/80 transition-colors inline-flex items-center gap-2"
              >
                ↓ Download Template CSV
              </button>
            </div>

            {/* Step 2 */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-charcoal mb-2">Step 2 — Upload your filled CSV</p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="w-full p-2.5 border border-beige text-sm file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20"
              />
            </div>

            {/* Preview */}
            {csvPreview.length > 0 && !bulkResult && (
              <div className="mb-2">
                <p className="text-sm font-semibold text-charcoal mb-2">
                  Preview — <span className="text-green-600">{csvPreview.filter(r => r.valid).length} valid</span>
                  {csvPreview.filter(r => !r.valid).length > 0 && (
                    <>, <span className="text-red-500">{csvPreview.filter(r => !r.valid).length} invalid</span></>
                  )}
                </p>
                <div className="overflow-x-auto border border-beige mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-beige bg-offwhite/60">
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50 w-10">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50">Title</th>
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50">Author</th>
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50">Price</th>
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50">Stock</th>
                        <th className="px-3 py-2 text-left font-medium text-charcoal/50">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 10).map(row => (
                        <tr key={row.rowNum} className={`border-b border-beige/50 last:border-0 ${row.valid ? '' : 'bg-red-50/60'}`}>
                          <td className="px-3 py-2 text-charcoal/40">{row.rowNum}</td>
                          <td className="px-3 py-2 font-medium text-charcoal truncate max-w-[160px]">{row.valid ? row.book.title : '—'}</td>
                          <td className="px-3 py-2 text-charcoal/70 truncate max-w-[120px]">{row.valid ? row.book.author : '—'}</td>
                          <td className="px-3 py-2">{row.valid ? `₦${row.book.price.toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2">{row.valid ? row.book.stock : '—'}</td>
                          <td className="px-3 py-2">
                            {row.valid
                              ? <span className="text-green-600 font-bold">✓ OK</span>
                              : <span className="text-red-500">{row.error}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvPreview.length > 10 && (
                  <p className="text-xs text-charcoal/40 mb-3 px-1">… and {csvPreview.length - 10} more rows</p>
                )}
                <button
                  onClick={handleBulkImport}
                  disabled={bulkUploading || csvPreview.filter(r => r.valid).length === 0}
                  className="w-full py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50"
                >
                  {bulkUploading ? 'Importing...' : `Import ${csvPreview.filter(r => r.valid).length} Books`}
                </button>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div className="border border-beige p-5 bg-offwhite/50">
                <p className="font-bold text-charcoal mb-4">Import Complete</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 border border-green-100 p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{bulkResult.added}</p>
                    <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mt-1">Books Added</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-100 p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-600">{bulkResult.skipped}</p>
                    <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wide mt-1">Already Existed</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsBulkOpen(false); setBulkResult(null); setCsvPreview([]) }}
                  className="w-full py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Meeting Form Modal ────────────────────────────────────────────────── */}
      {isMeetingFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">{editingMeeting ? 'Edit Event' : 'Schedule Event'}</h3>
              <button onClick={() => setIsMeetingFormOpen(false)} className="text-charcoal/40 hover:text-charcoal text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleAddMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Event Title *</label>
                <input
                  required
                  value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  placeholder="e.g. Monthly Book Review"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Date *</label>
                  <input
                    type="date" required
                    value={meetingForm.date}
                    onChange={e => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Time *</label>
                  <input
                    type="time" required
                    value={meetingForm.time}
                    onChange={e => setMeetingForm({ ...meetingForm, time: e.target.value })}
                    className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Type</label>
                <select
                  value={meetingForm.type}
                  onChange={e => setMeetingForm({ ...meetingForm, type: e.target.value as ClubMeeting['type'] })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 bg-white text-sm"
                >
                  <option value="discussion">Book Discussion</option>
                  <option value="event">Social Event</option>
                  <option value="meetup">Meetup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Location *</label>
                <input
                  required
                  value={meetingForm.location}
                  onChange={e => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm"
                  placeholder="Physical address or Google Meet link"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Description *</label>
                <textarea
                  required rows={3}
                  value={meetingForm.description}
                  onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 text-sm resize-none"
                  placeholder="What will happen at this event?"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal/60 mb-1 uppercase tracking-wide">Linked Book (optional)</label>
                <select
                  value={meetingForm.bookId || ''}
                  onChange={e => {
                    const book = books.find(b => b.id === e.target.value)
                    setMeetingForm({ ...meetingForm, bookId: e.target.value || undefined, bookTitle: book?.title })
                  }}
                  className="w-full p-3 border border-beige focus:outline-none focus:border-charcoal/40 bg-white text-sm"
                >
                  <option value="">None</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMeetingFormOpen(false)}
                  className="flex-1 py-3 border border-beige font-bold text-xs uppercase tracking-wide hover:bg-offwhite transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={meetingSaving}
                  className="flex-1 py-3 bg-terracotta text-white font-bold text-xs uppercase tracking-wide hover:bg-terracotta/90 transition-colors disabled:opacity-50"
                >
                  {meetingSaving ? 'Saving...' : (editingMeeting ? 'Save Changes' : 'Schedule Event')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
