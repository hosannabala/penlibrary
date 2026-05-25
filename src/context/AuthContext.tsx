'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ensureProfile } from '../lib/gamification'

export type AuthUser = {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
}

type AuthCtx = {
  user: AuthUser | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

function toAuthUser(supabaseUser: any): AuthUser {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
    photoURL: supabaseUser.user_metadata?.avatar_url ?? supabaseUser.user_metadata?.picture ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser = toAuthUser(session.user)
        setUser(authUser)
        ensureProfile(authUser.uid, authUser.email).catch(() => {})
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser = toAuthUser(session.user)
        setUser(authUser)
        ensureProfile(authUser.uid, authUser.email).catch(() => {})
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error('Login failed:', error)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, loginWithGoogle, logout }), [user, loading])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
