'use client'
import { useCart } from '../../context/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Book } from '../../lib/types'

function effectivePrice(book: Book) {
  return typeof book.salePrice === 'number' && book.salePrice < book.price
    ? book.salePrice : book.price
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total } = useCart()
  const router = useRouter()

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold mb-3 text-charcoal">Your cart is empty</h2>
        <p className="text-charcoal/60 mb-8">Looks like you haven't added any books yet.</p>
        <Link
          href="/catalog"
          className="px-8 py-3 bg-terracotta text-white font-bold uppercase tracking-wide hover:bg-terracotta/90 transition-colors"
        >
          Browse Books
        </Link>
      </div>
    )
  }

  return (
    <div className="py-10 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-8 overflow-x-auto whitespace-nowrap pb-1">
        <span className="text-terracotta shrink-0">Cart</span>
        <span className="text-charcoal/30 shrink-0">›</span>
        <span className="text-charcoal/40 shrink-0">Checkout</span>
        <span className="text-charcoal/30 shrink-0">›</span>
        <span className="text-charcoal/40 shrink-0">Complete</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Cart Table */}
        <div className="lg:col-span-2">
          {/* Table header — desktop only */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-beige pb-3 mb-2 text-xs font-bold uppercase tracking-widest text-charcoal/50">
            <span>Product</span>
            <span className="text-center">Price</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Subtotal</span>
            <span />
          </div>

          <div className="divide-y divide-beige">
            {items.map(item => {
              const price = effectivePrice(item.book)
              const isSale = price < item.book.price
              return (
                <div key={item.book.id} className="py-5 grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                  {/* Product */}
                  <div className="flex items-center gap-4">
                    {item.book.coverUrl ? (
                      <Link href={`/catalog/${item.book.id}` as any} className="shrink-0">
                        <div className="relative w-14 h-20 rounded overflow-hidden shadow-sm">
                          <Image
                            src={item.book.coverUrl}
                            alt={item.book.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-14 h-20 bg-beige rounded flex items-center justify-center text-charcoal/20 font-bold text-2xl shrink-0">
                        {item.book.title[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/catalog/${item.book.id}` as any} className="font-semibold text-charcoal hover:text-terracotta transition-colors line-clamp-2 text-sm leading-snug">
                        {item.book.title}
                      </Link>
                      <p className="text-xs text-charcoal/50 mt-1">{item.book.author}</p>
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="text-center">
                    <span className="md:hidden text-xs text-charcoal/50 mr-1">Price:</span>
                    {isSale ? (
                      <span className="text-sm font-semibold text-terracotta">₦{price.toLocaleString()}</span>
                    ) : (
                      <span className="text-sm font-semibold text-charcoal">₦{price.toLocaleString()}</span>
                    )}
                    {isSale && (
                      <span className="block text-xs text-charcoal/40 line-through">₦{item.book.price.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex justify-center">
                    <div className="flex items-center border border-beige overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                        className="w-11 h-11 flex items-center justify-center text-charcoal/50 hover:bg-beige hover:text-terracotta transition-colors text-lg"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-semibold text-charcoal">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.book.id, Math.min(item.book.stock, item.quantity + 1))}
                        className="w-11 h-11 flex items-center justify-center text-charcoal/50 hover:bg-beige hover:text-terracotta transition-colors text-lg"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-right">
                    <span className="md:hidden text-xs text-charcoal/50 mr-1">Subtotal:</span>
                    <span className="text-sm font-bold text-charcoal">₦{(price * item.quantity).toLocaleString()}</span>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.book.id)}
                    className="text-charcoal/25 hover:text-red-400 transition-colors p-3 justify-self-end md:justify-self-auto -mr-2"
                    title="Remove item"
                    aria-label={`Remove ${item.book.title}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Continue shopping */}
          <div className="mt-6">
            <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-charcoal/50 hover:text-terracotta transition-colors font-medium">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Cart Totals */}
        <div>
          <div className="border border-beige p-6 lg:sticky lg:top-24">
            <h3 className="text-base font-bold uppercase tracking-widest text-charcoal mb-6">Cart Totals</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-charcoal/70">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-charcoal/70">
                <span>Shipping</span>
                <span className="text-charcoal/50 italic text-xs">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-beige pt-4 flex justify-between font-bold text-lg text-charcoal mb-6">
              <span>Total</span>
              <span className="text-terracotta">₦{total.toLocaleString()}</span>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3.5 bg-terracotta text-white font-bold uppercase tracking-widest text-sm hover:bg-terracotta/90 transition-colors shadow-soft"
            >
              Proceed to Checkout
            </button>

            <p className="text-center text-xs text-charcoal/40 mt-4">
              Secured by Paystack · Encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
