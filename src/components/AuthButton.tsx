'use client'
import Image from 'next/image'
import { useAuth } from '../context/AuthContext'

export default function AuthButton() {
  const { user, loading, loginWithGoogle, logout } = useAuth()
  if (loading) return <button className="px-4 py-2 rounded-2xl bg-beige">Loading…</button>
  if (!user) {
    return (
      <button onClick={loginWithGoogle} className="px-4 py-2 rounded-2xl bg-terracotta text-white shadow-soft">
        Sign In
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      {user.photoURL && <Image src={user.photoURL} alt="avatar" width={28} height={28} className="rounded-full" />}
      <button onClick={logout} className="px-4 py-2 rounded-2xl border border-beige hover:border-terracotta">
        Sign Out
      </button>
    </div>
  )
}
