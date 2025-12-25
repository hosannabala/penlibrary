import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProfile } from './types'

const thresholds = [0, 500, 1500, 5000]
const labels: UserProfile['level'][] = ['Bronze', 'Silver', 'Gold', 'Platinum']

export async function ensureProfile(uid: string, email: string) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const profile: UserProfile = { uid, email, xp: 0, level: 'Bronze', streak: 0, badges: [] }
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() })
  }
}

export function levelFor(xp: number): UserProfile['level'] {
  let idx = 0
  for (let i = 0; i < thresholds.length; i++) if (xp >= thresholds[i]) idx = i
  return labels[idx]
}

export async function award(uid: string, amount: number, badge?: string) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const data = snap.data() as any
  const xp = (data?.xp || 0) + amount
  const level = levelFor(xp)
  const badges = Array.from(new Set([...(data?.badges || []), ...(badge ? [badge] : [])]))
  await updateDoc(ref, { xp, level, badges })
}

export async function bumpStreak(uid: string) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const streak = (snap.data()?.streak || 0) + 1
  await updateDoc(ref, { streak })
}
