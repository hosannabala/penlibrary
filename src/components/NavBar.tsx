'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import AuthButton from './AuthButton'
import { useAuth } from '../context/AuthContext'

import { useCart } from '../context/CartContext'

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const { items } = useCart()
  const { user } = useAuth()
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  
  return (
    <header className="sticky top-0 z-50 bg-offwhite/80 backdrop-blur border-b border-beige">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Pen Library Services" width={32} height={32} />
          <span className="font-semibold">Pen Library Services</span>
        </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/catalog" className="hover:text-terracotta">Books</Link>
              <Link href="/club" className="hover:text-terracotta">Book Club</Link>
              <Link href="/events" className="hover:text-terracotta">Events</Link>
              <Link href="/consulting" className="hover:text-terracotta">Consulting</Link>
              {user && <Link href="/dashboard" className="hover:text-terracotta">Dashboard</Link>}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <input className="border rounded-2xl px-3 py-2 w-48" placeholder="Search books" />
              </div>
            </div>
            {/* Cart Icon - Visible on Mobile too */}
            {user && (
              <Link href="/cart" aria-label="Cart" className="p-2 rounded-2xl border border-beige hover:border-terracotta relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6h14l-2 8H8L6 6z" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.5" fill="#2E2E2E"/><circle cx="17" cy="20" r="1.5" fill="#2E2E2E"/></svg>
                {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-terracotta text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
              </Link>
            )}
            <div className="hidden md:block">
               <AuthButton />
            </div>
            <button
              aria-label="Open menu"
              className="md:hidden p-2 rounded-2xl border border-beige"
              onClick={() => setOpen(!open)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-beige bg-offwhite">
          <div className="px-4 pt-4 pb-2">
            <input className="border rounded-2xl px-3 py-2 w-full" placeholder="Search books" />
          </div>
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 grid gap-2 text-sm">
            <Link href="/catalog" className="py-2 hover:text-terracotta">Books</Link>
            <Link href="/club" className="py-2 hover:text-terracotta">Book Club</Link>
            <Link href="/events" className="py-2">Events</Link>
            <Link href="/consulting" className="py-2">Consulting</Link>
            {user && <Link href="/dashboard" className="py-2">Dashboard</Link>}
          </nav>
          <div className="px-4 sm:px-6 lg:px-8 pb-3">
            <AuthButton />
          </div>
        </div>
      )}
    </header>
  )
}
