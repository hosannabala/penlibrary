'use client'
import Link from 'next/link'
import Image from 'next/image'
import type { Book } from '@/lib/types'
import { useCart } from '@/context/CartContext'

function NGN(n: number) {
  return `₦${n.toLocaleString()}`
}

export default function ProductCard({ book, isNew }: { book: Book; isNew?: boolean }) {
  const { addToCart } = useCart()
  const isSale = typeof book.salePrice === 'number' && book.salePrice < book.price
  const displayPrice = isSale ? book.salePrice! : book.price
  const pct = isSale ? Math.round(((book.price - book.salePrice!) / book.price) * 100) : 0
  const isOutOfStock = book.stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isOutOfStock) addToCart(book, 1)
  }

  return (
    <Link
      href={`/catalog/${book.id}`}
      className="group flex flex-col"
      aria-label={`${book.title} by ${book.author}`}
    >
      {/* Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-[#F0EDE8] mb-3">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#2E2E2E]/10 font-bold text-7xl select-none">
            {book.title?.[0] || 'B'}
          </div>
        )}

        {/* Badge — priority: sale > featured > new */}
        {isSale ? (
          <span className="absolute top-2 left-2 z-20 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide" style={{ backgroundColor: '#F07A22' }}>
            -{pct}%
          </span>
        ) : book.featured ? (
          <span className="absolute top-2 left-2 z-20 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide" style={{ backgroundColor: '#1E3777' }}>
            Featured
          </span>
        ) : isNew ? (
          <span className="absolute top-2 left-2 z-20 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide" style={{ backgroundColor: '#F07A22' }}>
            New
          </span>
        ) : null}

        {book.preOrder && (
          <span className="absolute bottom-0 left-0 right-0 z-20 text-center text-white text-[10px] font-bold py-1 uppercase tracking-wide" style={{ backgroundColor: 'rgba(30,55,119,0.88)' }}>
            Pre-order
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <span className="text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-black/50">
              Out of Stock
            </span>
          </div>
        )}

      </div>

      {/* Text info */}
      <div className="flex flex-col gap-0.5 mt-0.5">
        <p className="text-xs text-[#2E2E2E]/40 truncate uppercase tracking-wide">{book.author}</p>
        <p className="text-sm font-semibold text-[#2E2E2E] line-clamp-2 leading-snug group-hover:text-[#F07A22] transition-colors">
          {book.title}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-bold text-sm" style={{ color: '#F07A22' }}>{NGN(displayPrice)}</span>
          {isSale && (
            <span className="text-xs line-through text-[#2E2E2E]/30">{NGN(book.price)}</span>
          )}
        </div>
      </div>

      {/* Always-visible Add to Cart button */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className="mt-3 w-full py-3 text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isOutOfStock ? '#EBEBEB' : '#1E3777',
          color: isOutOfStock ? '#2E2E2E99' : 'white',
        }}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </Link>
  )
}
