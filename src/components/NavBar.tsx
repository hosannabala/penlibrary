'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import type { SiteSettings } from '../lib/settings'

function NGN(n: number) { return `₦${n.toLocaleString()}` }

const NAV_LINKS = [
  { label: 'Best Sellers', href: '/catalog?sort=bestseller' },
  { label: 'Events', href: '/events' },
  { label: 'About Us', href: '/about' },
  { label: 'Consulting', href: '/consulting' },
]

const CLUB_ITEMS = [
  { label: 'Book Club', href: '/club' },
  { label: 'Events', href: '/events' },
]

function Dropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-4 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase text-charcoal/60 hover:text-[#F07A22] transition-colors">
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="hidden group-hover:block absolute top-full left-0 z-50 bg-white border border-[#EBEBEB] shadow-xl min-w-[180px] py-1">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href as any}
            className="block px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/60 hover:text-[#F07A22] hover:bg-[#FAFAFA] transition-colors whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function NavBar({ settings }: { settings: SiteSettings }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogItems, setCatalogItems] = useState<{ label: string; href: string }[]>([
    { label: 'All Books', href: '/catalog' },
  ])
  const { items } = useCart()
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    supabase.from('categories').select('name').order('name').then(({ data }) => {
      if (data?.length) {
        setCatalogItems([
          { label: 'All Books', href: '/catalog' },
          ...data.map(c => ({ label: c.name, href: `/catalog?category=${encodeURIComponent(c.name)}` })),
        ])
      }
    })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/catalog?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
    setMobileOpen(false)
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = items.reduce((sum, i) => {
    const price = typeof i.book.salePrice === 'number' && i.book.salePrice < i.book.price
      ? i.book.salePrice : i.book.price
    return sum + price * i.quantity
  }, 0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Top info bar — slim, navy */}
      {(settings.announcement_bar || settings.email || settings.phone || settings.instagram_url) && (
      <div
        className="hidden md:flex w-full text-[11px] py-2 px-6 items-center justify-between"
        style={{ backgroundColor: '#1E3777' }}
      >
        <span className="text-white/55 tracking-wide">
          {settings.announcement_bar}
        </span>
        <div className="flex items-center gap-5 text-white/50">
          <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
            {settings.email}
          </a>
          {settings.phone && (
            <>
              <span className="w-px h-3 bg-white/20" />
              <a href={`tel:+${settings.phone}`} className="hover:text-white transition-colors">
                +{settings.phone}
              </a>
            </>
          )}
          {settings.instagram_url && (
            <>
              <span className="w-px h-3 bg-white/20" />
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            </>
          )}
        </div>
      </div>
      )}

      {/* Sticky header */}
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.09)]' : 'border-b border-[#EBEBEB]'
        }`}
      >
        {/* Logo · Search · Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-5 h-[68px]">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/logo.png"
              alt="Pen Library Services"
              width={120}
              height={46}
              className="object-contain h-10 w-auto"
              priority
            />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-auto">
            <div className="flex w-full border border-[#EBEBEB] focus-within:border-charcoal/40 transition-colors">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title or author..."
                className="flex-1 px-4 py-2.5 text-sm bg-transparent focus:outline-none text-charcoal placeholder:text-charcoal/30"
              />
              <button
                type="submit"
                aria-label="Search"
                className="px-4 py-2.5 text-white shrink-0 transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F07A22' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </form>

          {/* Auth + Cart */}
          <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">

            {/* Auth — desktop */}
            {!authLoading && (
              <div className="hidden md:flex items-center gap-3">
                {user ? (
                  <>
                    {user.photoURL && (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName ?? 'Avatar'}
                        width={30}
                        height={30}
                        className="rounded-full border border-[#EBEBEB]"
                      />
                    )}
                    <Link
                      href="/dashboard"
                      className="text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/60 hover:text-charcoal transition-colors"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={logout}
                      className="text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/35 hover:text-charcoal transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={loginWithGoogle}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white px-5 py-2.5 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#1E3777' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Sign In
                  </button>
                )}
              </div>
            )}

            <span className="hidden md:block w-px h-6 bg-[#EBEBEB]" />

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="View cart"
              className="flex items-center gap-2.5 px-3 py-2 transition-colors group"
            >
              <div className="relative">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-charcoal group-hover:text-[#F07A22] transition-colors"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {totalItems > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: '#F07A22' }}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[9px] uppercase tracking-widest text-charcoal/35 font-semibold">Cart</span>
                <span className="text-[12px] font-bold text-charcoal group-hover:text-[#F07A22] transition-colors">
                  {NGN(cartTotal)}
                </span>
              </div>
            </Link>

            {/* Mobile hamburger */}
            <button
              aria-label="Open menu"
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {mobileOpen
                  ? <path d="M18 6L6 18M6 6l12 12" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" />
                  : <path d="M4 7h16M4 12h16M4 17h16" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center justify-center border-t border-[#EBEBEB]">
          {NAV_LINKS.slice(0, 1).map(l => (
            <Link
              key={l.href}
              href={l.href as any}
              className="px-4 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase text-charcoal/60 hover:text-[#F07A22] transition-colors"
            >
              {l.label}
            </Link>
          ))}

          <Dropdown label="Catalog" items={catalogItems} />

          {NAV_LINKS.slice(1).map(l => (
            <Link
              key={l.href}
              href={l.href as any}
              className="px-4 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase text-charcoal/60 hover:text-[#F07A22] transition-colors"
            >
              {l.label}
            </Link>
          ))}

          <Dropdown label="Book Club" items={CLUB_ITEMS} />

          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-3.5 text-[11px] font-bold tracking-[0.15em] uppercase text-charcoal/60 hover:text-[#F07A22] transition-colors"
            >
              My Orders
            </Link>
          )}
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#EBEBEB] bg-white">
            <div className="px-4 pt-4 pb-2">
              <form onSubmit={handleSearch} className="flex border border-[#EBEBEB]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books..."
                  className="flex-1 px-4 py-2.5 text-sm focus:outline-none text-charcoal placeholder:text-charcoal/30"
                />
                <button
                  type="submit"
                  className="px-4 text-white"
                  style={{ backgroundColor: '#F07A22' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" />
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </div>

            <nav className="px-4 py-2 flex flex-col divide-y divide-[#EBEBEB]">
              {[
                { label: 'Best Sellers', href: '/catalog?sort=bestseller' },
                ...catalogItems,
                { label: 'Events', href: '/events' },
                { label: 'Book Club', href: '/club' },
                { label: 'About Us', href: '/about' },
                { label: 'Consulting', href: '/consulting' },
                ...(user ? [{ label: 'My Orders', href: '/dashboard' }] : []),
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href as any}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-charcoal/60 hover:text-[#F07A22] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-[#EBEBEB]">
              {user ? (
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <Image src={user.photoURL} alt="avatar" width={32} height={32} className="rounded-full" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-charcoal">{user.displayName ?? user.email}</p>
                    <button
                      onClick={logout}
                      className="text-[11px] text-charcoal/40 hover:text-charcoal mt-0.5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-3 text-white text-[11px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: '#1E3777' }}
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
