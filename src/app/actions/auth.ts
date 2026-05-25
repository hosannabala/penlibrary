'use server'

import { createAdminSession, clearAdminSession } from '@/lib/server-auth'

export async function loginAdminAction(accessToken: string): Promise<void> {
  await createAdminSession(accessToken)
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession()
}
