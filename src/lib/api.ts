import { supabase } from './supabase'

export async function requestConsultation(payload: {
  name: string
  email: string
  topic: string
  notes?: string
}) {
  const { error } = await supabase.from('consultations').insert({
    name: payload.name,
    email: payload.email,
    topic: payload.topic,
    notes: payload.notes ?? null,
    status: 'requested',
  })
  if (error) throw new Error('Failed to request consultation')
  return { ok: true }
}
