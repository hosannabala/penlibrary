'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(() => router.replace(next as any))
        .catch(() => router.replace('/' as any))
    } else {
      router.replace('/')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-charcoal/60">Signing you in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
