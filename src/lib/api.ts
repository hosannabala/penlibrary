import { db } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function requestConsultation(payload: { name: string; email: string; topic: string; notes?: string }) {
  try {
    await addDoc(collection(db, 'consultations'), {
      ...payload,
      status: 'requested',
      createdAt: serverTimestamp()
    })
    return { ok: true }
  } catch (error) {
    console.error('Error requesting consultation:', error)
    throw new Error('failed to request consultation')
  }
}
