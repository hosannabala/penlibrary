import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { SiteSettingsProvider } from '../context/SiteSettingsContext'
import { getSettings } from '../lib/settings'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://penlibrary.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pen Library Services',
    template: '%s | Pen Library Services',
  },
  description: 'Rekindling the reading culture. Browse, buy, and grow through books — delivered across Nigeria.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png', sizes: 'any' }],
    apple: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: [{ url: '/logo.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'Pen Library Services',
    title: 'Pen Library Services',
    description: 'Rekindling the reading culture. Browse, buy, and grow through books — delivered across Nigeria.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Pen Library Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pen Library Services',
    description: 'Rekindling the reading culture. Browse, buy, and grow through books — delivered across Nigeria.',
    images: ['/logo.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()

  return (
    <html lang="en">
      <body className={`${poppins.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <SiteSettingsProvider settings={settings}>
              <NavBar settings={settings} />
              <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex-1">{children}</main>
              <Footer settings={settings} />
            </SiteSettingsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
