'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getBook, getWishlist, toggleWishlist } from '../../../lib/db'
import type { Book } from '../../../lib/types'
import { useCart } from '../../../context/CartContext'
import { useAuth } from '../../../context/AuthContext'

type Props = { params: { id: string } }

export default function ProductPage({ params }: Props) {
  const { id } = params
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartMsg, setCartMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { addToCart } = useCart()
  const { user, loginWithGoogle } = useAuth()

  useEffect(() => {
    async function load() {
      try {
        const data = await getBook(id)
        setBook(data)
        if (user && data) {
          const wishlist = await getWishlist(user.uid)
          setIsWishlisted(wishlist.includes(id))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  async function handleWishlist() {
    if (!user) {
      loginWithGoogle()
      return
    }
    setWishlistLoading(true)
    try {
      const updated = await toggleWishlist(user.uid, id)
      setIsWishlisted(updated.includes(id))
    } catch {
      // silently fail wishlist errors
    } finally {
      setWishlistLoading(false)
    }
  }

  function handleAddToCart() {
    if (!book) return
    addToCart(book, quantity)
    setCartMsg({ type: 'success', text: `${quantity > 1 ? `${quantity}×` : ''} ${book.title} added to cart!` })
    setTimeout(() => setCartMsg(null), 3000)
  }

  if (loading) return <div className="py-20 text-center text-charcoal/50">Loading...</div>

  if (!book) return (
    <div className="py-20 text-center">
      <h2 className="text-xl font-semibold mb-4">Book Not Found</h2>
      <Link href="/catalog" className="text-terracotta hover:underline">← Back to Catalog</Link>
    </div>
  )

  const price = typeof book.salePrice === 'number' && book.salePrice < book.price ? book.salePrice : book.price
  const isSale = price < book.price
  const discount = isSale ? Math.round(((book.price - price) / book.price) * 100) : 0

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-terracotta transition-colors mb-8">
        ← Back to Catalog
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        {/* Cover */}
        <div className="aspect-[2/3] bg-beige rounded-2xl overflow-hidden relative shadow-soft max-w-sm mx-auto w-full">
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 400px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/20 font-bold text-8xl select-none">
              {book.title[0]}
            </div>
          )}
          {book.preOrder && (
            <span className="absolute left-3 bottom-3 px-3 py-1 rounded-full bg-charcoal text-white text-xs font-semibold">
              Pre‑order
            </span>
          )}
          {isSale && (
            <span className="absolute right-3 top-3 px-3 py-1 rounded-full bg-terracotta text-white text-xs font-bold">
              -{discount}%
            </span>
          )}
          {book.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="px-4 py-2 bg-white text-charcoal text-sm font-semibold rounded-full">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta mb-2">{book.category}</div>
          <h1 className="text-2xl md:text-4xl font-bold text-charcoal leading-tight mb-2">{book.title}</h1>
          <p className="text-lg text-charcoal/60 mb-6">by {book.author}</p>

          <div className="mb-6">
            {isSale ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-terracotta">₦{price.toLocaleString()}</span>
                <span className="text-xl line-through text-charcoal/40">₦{book.price.toLocaleString()}</span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-terracotta">₦{book.price.toLocaleString()}</span>
            )}
          </div>

          {book.description && (
            <p className="text-charcoal/70 leading-relaxed mb-8 text-sm">{book.description}</p>
          )}

          {/* Quantity + Add to cart */}
          {book.stock > 0 && (
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border border-beige rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 flex items-center justify-center text-charcoal/50 hover:text-terracotta hover:bg-beige transition-colors text-xl">
                  −
                </button>
                <span className="w-10 text-center font-bold text-charcoal">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                  className="w-11 h-11 flex items-center justify-center text-charcoal/50 hover:text-terracotta hover:bg-beige transition-colors text-xl">
                  +
                </button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-terracotta text-white font-bold uppercase tracking-wide hover:bg-terracotta/90 transition-colors shadow-soft">
                {book.preOrder ? 'Pre‑order Now' : 'Add to Cart'}
              </button>
            </div>
          )}

          {book.stock === 0 && (
            <div className="py-3 px-6 bg-charcoal/5 text-charcoal/50 text-center font-semibold text-sm mb-4">
              Out of Stock
            </div>
          )}

          {/* Cart feedback */}
          {cartMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${
              cartMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {cartMsg.text}
            </div>
          )}

          {/* Wishlist */}
          <button onClick={handleWishlist} disabled={wishlistLoading}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isWishlisted ? 'text-terracotta' : 'text-charcoal/50 hover:text-terracotta'
            }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistLoading ? 'Saving...' : (isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist')}
          </button>

          <div className="mt-8 pt-6 border-t border-beige text-xs text-charcoal/50 space-y-1">
            <p>Stock: {book.stock > 0 ? `${book.stock} copies available` : 'Out of stock'}</p>
            <p>Delivery: 3–5 business days within Nigeria</p>
          </div>
        </div>
      </div>
    </div>
  )
}
