'use client'
import Image from 'next/image'
import { useAuth } from '../context/AuthContext'

export default function AuthButton() {
  const { user, loading, loginWithGoogle, logout } = useAuth()

  if (loading) {
    return (
      <button className="px-4 py-1.5 border border-beige text-xs text-charcoal/40 cursor-default">
        Loading…
      </button>
    )
  }

  if (!user) {
    return (
      <button
        onClick={loginWithGoogle}
        className="px-5 py-1.5 border border-charcoal text-xs font-bold uppercase tracking-wide text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
      >
        LOGIN
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL && (
        <Image src={user.photoURL} alt="avatar" width={28} height={28} className="rounded-full" />
      )}
      <button
        onClick={logout}
        className="px-4 py-1.5 border border-beige text-xs font-bold uppercase tracking-wide text-charcoal hover:border-terracotta hover:text-terracotta transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}
