'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import type { Book, CartItem } from '../lib/types'

type CartContextType = {
  items: CartItem[]
  addToCart: (book: Book) => void
  removeFromCart: (bookId: string) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
        try {
            setItems(JSON.parse(saved))
        } catch (e) {
            console.error("Failed to parse cart", e)
        }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
        localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, mounted])

  function addToCart(book: Book) {
    setItems(prev => {
      const existing = prev.find(i => i.book.id === book.id)
      if (existing) {
        return prev.map(i => i.book.id === book.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { book, quantity: 1 }]
    })
  }

  function removeFromCart(bookId: string) {
    setItems(prev => prev.filter(i => i.book.id !== bookId))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((acc, item) => acc + (item.book.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
