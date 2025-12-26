import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pen Library Services',
  description: 'Rekindling the reading culture.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <CartProvider>
            <NavBar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-grow w-full">{children}</main>
            <Footer />
            <Analytics />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
