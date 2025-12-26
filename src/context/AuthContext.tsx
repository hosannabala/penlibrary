'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { ensureProfile } from '../lib/gamification'

type AuthCtx = {
  user: any | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: any) => {
      setUser(u)
      setLoading(false)
      if (u?.uid && u.email) await ensureProfile(u.uid, u.email)
    })
    return () => unsub()
  }, [])

  async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
        console.error("Login failed:", error)
        alert("Login failed: " + error.message)
    }
  }
  async function logout() {
    await signOut(auth)
  }

  const value = useMemo(() => ({ user, loading, loginWithGoogle, logout }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
