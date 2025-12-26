import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      PAYSTACK_SECRET: { present: !!process.env.PAYSTACK_SECRET, length: process.env.PAYSTACK_SECRET?.length || 0 },
      FIREBASE_PROJECT_ID: { present: !!process.env.FIREBASE_PROJECT_ID, value: process.env.FIREBASE_PROJECT_ID },
      FIREBASE_CLIENT_EMAIL: { present: !!process.env.FIREBASE_CLIENT_EMAIL, value: process.env.FIREBASE_CLIENT_EMAIL },
      FIREBASE_PRIVATE_KEY: { present: !!process.env.FIREBASE_PRIVATE_KEY, validFormat: process.env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY') },
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: { present: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY },
      NEXT_PUBLIC_FIREBASE_API_KEY: { present: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    },
    firebase: {
        adminInit: false,
        firestoreConnection: false,
        firestoreWrite: false,
        firestoreRead: false,
        latencyMs: 0
    },
    system: {
        nodeEnv: process.env.NODE_ENV,
        memoryUsage: process.memoryUsage(),
    },
    error: null
  }

  const start = Date.now()

  try {
    // 1. Check Admin Init
    const db = getAdminFirestore()
    results.firebase.adminInit = true

    // 2. Check Connection (List Collections)
    await db.listCollections()
    results.firebase.firestoreConnection = true

    // 3. Check Write/Read
    const testRef = db.collection('_diagnostics').doc('health_check')
    const testData = { lastCheck: new Date().toISOString(), status: 'ok' }
    await testRef.set(testData)
    results.firebase.firestoreWrite = true

    const docSnap = await testRef.get()
    if (docSnap.exists && docSnap.data()?.status === 'ok') {
        results.firebase.firestoreRead = true
    }
    
    // Cleanup (optional, but good practice)
    await testRef.delete()

    results.firebase.latencyMs = Date.now() - start

  } catch (error: any) {
    results.error = error.message
    results.stack = error.stack
    console.error('Diagnostics Error:', error)
  }

  return NextResponse.json(results)
}
