import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms & Conditions' }

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

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#F07A22' }}>Legal</p>
        <h1 className="text-3xl font-bold text-charcoal mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-charcoal/40">Last updated: January 2025</p>
      </div>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Pen Library Services (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
      </Section>

      <Section title="2. Products and Pricing">
        <p>All book prices are listed in Nigerian Naira (₦) and are subject to change without notice. We reserve the right to limit quantities and to refuse service. Prices displayed online are final at the time of order placement.</p>
        <p>Pre-order items may be subject to pricing adjustments before the official release date. You will be notified of any changes before your payment is processed.</p>
      </Section>

      <Section title="3. Orders and Payment">
        <p>Orders are confirmed only after successful payment via Paystack. You will receive an email confirmation with your order reference. Please retain this reference for all future correspondence regarding your order.</p>
        <p>We reserve the right to cancel any order at our discretion if payment cannot be verified or if the ordered item is no longer available.</p>
      </Section>

      <Section title="4. Delivery">
        <p>We ship nationwide across Nigeria. Delivery timelines are estimates and may vary based on location and courier availability. Pen Library Services is not liable for delays caused by third-party couriers or circumstances beyond our control.</p>
        <p>Free pickup is available at our Port Harcourt location: Okuru-Ama, Port Harcourt, Rivers State. Please bring a copy of your order confirmation when collecting.</p>
      </Section>

      <Section title="5. Returns and Refunds">
        <p>We accept returns within 7 days of delivery for items that are damaged or significantly different from their description. Items must be returned in their original condition. To initiate a return, contact us via WhatsApp or email with your order reference and photos of the issue.</p>
        <p>Refunds are processed within 5–10 business days to the original payment method.</p>
      </Section>

      <Section title="6. Book Club">
        <p>Membership in the Pen Library Book Club is voluntary and free. We reserve the right to remove members who violate our community guidelines. Event RSVPs are non-binding and subject to availability.</p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>All content on this website, including text, images, and design, is the property of Pen Library Services and may not be reproduced without written permission.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>Pen Library Services shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our total liability for any claim shall not exceed the value of the order in question.</p>
      </Section>

      <Section title="9. Contact">
        <p>For questions about these Terms, contact us at <a href="mailto:penlibrary@email.com" className="underline" style={{ color: '#F07A22' }}>penlibrary@email.com</a> or via our <Link href="/contact" className="underline" style={{ color: '#F07A22' }}>Contact page</Link>.</p>
      </Section>
    </div>
  )
}
