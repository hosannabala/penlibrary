import Link from 'next/link'
import Image from 'next/image'
import type { SiteSettings } from '../lib/settings'

function FootingHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-terracotta text-xs font-bold uppercase tracking-widest mb-4">
      {children}
    </h4>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href as any} className="text-white/60 hover:text-white text-sm transition-colors py-1 inline-block">
        {children}
      </Link>
    </li>
  )
}

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer style={{ backgroundColor: '#1E3777' }} className="text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="Pen Library Services" width={110} height={42} className="object-contain brightness-0 invert opacity-90" />
            </div>
            <p className="italic text-white/50 text-sm mb-3">&quot;Knowledge Covers the Earth&quot;</p>
            <p className="text-white/50 text-xs leading-relaxed mb-4">
              {settings.address}
            </p>
            <div className="flex flex-col gap-2">
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="text-white/50 hover:text-white text-xs transition-colors">
                  {settings.email}
                </a>
              )}
              {settings.phone && (
                <a href={`https://wa.me/${settings.phone}`} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white text-xs transition-colors">
                  WhatsApp: +{settings.phone}
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                  Instagram
                </a>
              )}
            </div>
          </div>

          {/* Col 2 — Shop */}
          <div>
            <FootingHeading>Shop</FootingHeading>
            <ul className="space-y-2.5">
              <FooterLink href="/catalog?sort=newest">New Arrivals</FooterLink>
              <FooterLink href="/catalog?sort=bestseller">Best Sellers</FooterLink>
              <FooterLink href="/catalog?sort=deals">Deals</FooterLink>
              <FooterLink href="/catalog?preorder=true">Pre-orders</FooterLink>
              <FooterLink href="/catalog">All Books</FooterLink>
            </ul>
          </div>

          {/* Col 3 — Community */}
          <div>
            <FootingHeading>Community</FootingHeading>
            <ul className="space-y-2.5">
              <FooterLink href="/club">Book Club</FooterLink>
              <FooterLink href="/events">Events</FooterLink>
              <FooterLink href="/consulting">Consulting</FooterLink>
              <FooterLink href="/dashboard">My Orders</FooterLink>
            </ul>
          </div>

          {/* Col 4 — Help */}
          <div>
            <FootingHeading>Help</FootingHeading>
            <ul className="space-y-2.5">
              <FooterLink href="/contact">Contact Us</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/dashboard">Track Order</FooterLink>
              <FooterLink href="/club#request">Request a Book</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} Pen Library Services. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
