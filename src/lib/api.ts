const base = process.env.NEXT_PUBLIC_FUNCTIONS_BASE || ''

export async function initializeCheckout(payload: { email: string; amount: number; metadata?: any }) {
  const res = await fetch(`${base}/initializeCheckout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('failed to init checkout')
  return res.json()
}

export async function requestConsultation(payload: { name: string; email: string; topic: string; notes?: string }) {
  const res = await fetch(`${base}/requestConsultation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('failed to request consultation')
  return res.json()
}
