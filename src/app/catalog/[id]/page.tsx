'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getBook } from '../../../lib/db'
import type { Book } from '../../../lib/types'
import { useCart } from '../../../context/CartContext'
import { useAuth } from '../../../context/AuthContext'

type Props = { params: { id: string } }

export default function ProductPage({ params }: Props) {
  const { id } = params
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { user, loginWithGoogle } = useAuth()

  useEffect(() => {
    async function fetch() {
      const data = await getBook(id)
      setBook(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  function handleAddToCart() {
    if (!user) {
      alert('Please sign in to add items to cart')
      loginWithGoogle()
      return
    }
    if (book) {
      addToCart(book)
      alert('Added to cart!')
    }
  }

  if (loading) return <div className="py-20 text-center text-charcoal/50">Loading book details...</div>
  
  if (!book) return (
    <div className="py-20 text-center">
      <h2 className="text-xl font-semibold mb-4">Book Not Found</h2>
      <Link href="/catalog" className="text-terracotta hover:underline">Back to Catalog</Link>
    </div>
  )

  return (
    <div className="py-8">
      <Link href="/catalog" className="text-terracotta hover:underline mb-6 inline-block">&larr; Back to Catalog</Link>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="aspect-[2/3] bg-beige rounded-2xl overflow-hidden relative shadow-soft">
          {book.coverUrl ? (
            <Image 
              src={book.coverUrl} 
              alt={book.title} 
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/20 font-bold text-6xl">
              {book.title[0]}
            </div>
          )}
        </div>
        
        <div>
          <div className="text-sm uppercase tracking-wider text-terracotta font-medium mb-2">{book.category}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-charcoal">{book.title}</h1>
          <div className="text-xl text-charcoal/70 mb-6">{book.author}</div>
          
          <div className="text-3xl font-bold text-terracotta mb-8">₦{book.price.toLocaleString()}</div>
          
          <div className="prose prose-lg text-charcoal/80 mb-8">
            <p>{book.description || 'No description available for this book.'}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleAddToCart}
              className="flex-1 px-8 py-4 rounded-2xl bg-terracotta text-white font-semibold shadow-soft hover:shadow-lg transition-all active:scale-95"
            >
              Add to Cart
            </button>
            <button className="px-8 py-4 rounded-2xl border-2 border-beige text-charcoal font-semibold hover:border-terracotta hover:text-terracotta transition-colors">
              Save to Wishlist
            </button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-beige text-sm text-charcoal/60">
            <p>Stock: {book.stock > 0 ? `${book.stock} copies available` : 'Out of Stock'}</p>
            <p>Delivery: Available within 3-5 business days</p>
          </div>
        </div>
      </div>
    </div>
  )
}
