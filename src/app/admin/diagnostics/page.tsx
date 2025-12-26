'use client'

import { useEffect, useState } from 'react'

export default function DiagnosticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/diagnostics')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-charcoal/60">Running System Diagnostics...</div>

  if (!data) return <div className="p-8 text-red-600 text-center">Failed to load diagnostics.</div>

  const isEnvHealthy = Object.values(data.env).every((v: any) => v.present)
  const isFirebaseHealthy = data.firebase.adminInit && data.firebase.firestoreConnection && data.firebase.firestoreWrite
  const isHealthy = isEnvHealthy && isFirebaseHealthy && !data.error

  return (
    <div className="min-h-screen bg-offwhite p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-soft p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-charcoal">System Health Check</h1>
            <div className="text-sm text-charcoal/50">
                Last checked: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
        </div>
        
        <div className={`p-6 rounded-2xl mb-8 text-center font-bold text-xl border ${isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          Overall Status: {isHealthy ? '✅ SYSTEM OPERATIONAL' : '⚠️ CRITICAL ISSUES DETECTED'}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Environment Variables */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    Environment Configuration
                </h2>
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                {Object.entries(data.env).map(([key, info]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-0">
                    <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-charcoal">{key}</span>
                        {info.length > 0 && <span className="text-xs text-charcoal/40">Length: {info.length} chars</span>}
                        {info.validFormat === false && <span className="text-xs text-red-500">Invalid Format</span>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${info.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {info.present ? 'OK' : 'MISSING'}
                    </span>
                    </div>
                ))}
                </div>
            </div>

            {/* Database & System */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    Database & Connectivity
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Firebase Admin Init</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${data.firebase.adminInit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {data.firebase.adminInit ? 'SUCCESS' : 'FAILED'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Firestore Connection</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${data.firebase.firestoreConnection ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {data.firebase.firestoreConnection ? 'CONNECTED' : 'FAILED'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Write Test</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${data.firebase.firestoreWrite ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {data.firebase.firestoreWrite ? 'PASSED' : 'FAILED'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Read Test</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${data.firebase.firestoreRead ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {data.firebase.firestoreRead ? 'PASSED' : 'FAILED'}
                        </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="text-sm font-medium text-charcoal/60">Latency</span>
                        <span className="font-mono text-sm">{data.firebase.latencyMs}ms</span>
                    </div>
                </div>

                {data.error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 overflow-x-auto">
                        <h3 className="font-bold mb-2">Error Details:</h3>
                        <pre className="whitespace-pre-wrap">{data.error}</pre>
                        {data.stack && <pre className="mt-2 text-xs opacity-75">{data.stack}</pre>}
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-8 flex justify-center">
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-charcoal text-white rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Rerun Diagnostics
             </button>
        </div>
      </div>
    </div>
  )
}
