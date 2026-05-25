'use client'
import { createContext, useContext } from 'react'
import type { SiteSettings } from '../lib/settings'
import { DEFAULT_SETTINGS } from '../lib/settings'

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS)

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings
  children: React.ReactNode
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
