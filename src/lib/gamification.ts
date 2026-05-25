import { supabase } from './supabase'
import type { UserProfile } from './types'

const thresholds = [0, 500, 1500, 5000]
const labels: UserProfile['level'][] = ['Bronze', 'Silver', 'Gold', 'Platinum']

export function levelFor(xp: number): UserProfile['level'] {
  let idx = 0
  for (let i = 0; i < thresholds.length; i++) if (xp >= thresholds[i]) idx = i
  return labels[idx]
}

export async function ensureProfile(uid: string, email: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('uid')
    .eq('uid', uid)
    .single()

  if (!data) {
    await supabase.from('user_profiles').insert({
      uid,
      email,
      xp: 0,
      level: 'Bronze',
      streak: 0,
      badges: [],
      wishlist: [],
    })
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('uid', uid)
    .single()

  if (!data) return null
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.display_name ?? undefined,
    photoURL: data.photo_url ?? undefined,
    xp: data.xp,
    level: data.level as UserProfile['level'],
    streak: data.streak,
    badges: data.badges ?? [],
    wishlist: data.wishlist ?? [],
  }
}

export async function award(uid: string, amount: number, badge?: string) {
  const profile = await getUserProfile(uid)
  if (!profile) return
  const xp = profile.xp + amount
  const level = levelFor(xp)
  const badges = Array.from(new Set([...profile.badges, ...(badge ? [badge] : [])]))
  await supabase.from('user_profiles').update({ xp, level, badges }).eq('uid', uid)
}

export async function bumpStreak(uid: string) {
  const profile = await getUserProfile(uid)
  if (!profile) return
  await supabase
    .from('user_profiles')
    .update({ streak: profile.streak + 1 })
    .eq('uid', uid)
}
