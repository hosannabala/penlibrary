import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold uppercase tracking-widest text-charcoal mb-3"
          style={{ borderLeft: '3px solid #F07A22', paddingLeft: '12px' }}>
        {title}
      </h2>
      <div className="text-sm text-charcoal/70 leading-relaxed space-y-3 pl-[15px]">
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F07A22' }}>Legal</p>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Privacy Policy</h1>
        <p className="text-sm text-charcoal/40">Last updated: January 2025</p>
      </div>

      <Section title="1. Information We Collect">
        <p>When you use Pen Library Services, we may collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contact details (name, email address, phone number) provided during checkout or sign-up</li>
          <li>Delivery address provided at checkout</li>
          <li>Order history and transaction records</li>
          <li>Account information if you sign in with Google (name, profile picture)</li>
          <li>Newsletter subscription email address if you opt in</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process and fulfill your orders</li>
          <li>Send order confirmations and delivery updates</li>
          <li>Respond to your enquiries and support requests</li>
          <li>Send newsletter updates if you have subscribed (you can unsubscribe at any time)</li>
          <li>Improve our website and services</li>
        </ul>
        <p>We do not sell, rent, or share your personal information with third parties except as required to fulfil your order (e.g., delivery couriers).</p>
      </Section>

      <Section title="3. Payment Security">
        <p>All payments are processed securely by Paystack. We do not store your card details. Payment information is transmitted directly to Paystack using industry-standard TLS encryption.</p>
      </Section>

      <Section title="4. Cookies">
        <p>We use essential cookies to maintain your session and cart. We do not use tracking or advertising cookies. You can disable cookies in your browser, but some features may not work correctly.</p>
      </Section>

      <Section title="5. Data Storage">
        <p>Your data is stored securely using Supabase (hosted on AWS) with row-level security. We retain order records for a minimum of 7 years for legal and accounting purposes. Account data is retained until you request deletion.</p>
      </Section>

      <Section title="6. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data (subject to legal retention requirements)</li>
          <li>Unsubscribe from marketing emails at any time</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:penlibrary@email.com" className="underline" style={{ color: '#F07A22' }}>penlibrary@email.com</a>.</p>
      </Section>

      <Section title="7. Third-Party Services">
        <p>We use the following third-party services which have their own privacy policies:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Paystack — payment processing</li>
          <li>Google OAuth — optional sign-in</li>
          <li>Supabase — database and authentication</li>
          <li>Shipbubble — delivery rate calculation</li>
        </ul>
      </Section>

      <Section title="8. Contact">
        <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:penlibrary@email.com" className="underline" style={{ color: '#F07A22' }}>penlibrary@email.com</a> or via our <Link href="/contact" className="underline" style={{ color: '#F07A22' }}>Contact page</Link>.</p>
      </Section>
    </div>
  )
}
