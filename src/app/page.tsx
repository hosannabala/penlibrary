export const revalidate = 3600 // revalidate homepage data every hour

import Hero from '../components/Hero'
import Link from 'next/link'
import Image from 'next/image'
import { getGallery } from '../lib/gallery'
import { getAllCategories } from '../lib/db'
import type { Category } from '../lib/types'
import dynamic from 'next/dynamic'

const HomeShowcase = dynamic(() => import('../components/HomeShowcase'), { ssr: false })
const NewsletterSignup = dynamic(() => import('../components/NewsletterSignup'), { ssr: false })

const testimonials = [
  {
    quote: "Pen Library is my go-to for Christian and motivational reads. Delivery was fast and the books were well-packaged.",
    name: "Chioma A.",
    location: "Port Harcourt",
  },
  {
    quote: "I found titles here I couldn't find anywhere else in PH. The book club is a real bonus — great community of readers.",
    name: "Emmanuel T.",
    location: "Lagos",
  },
  {
    quote: "Ordered three leadership books for my team and they arrived within days. Excellent selection and service.",
    name: "Blessing O.",
    location: "Abuja",
  },
]

export default async function Page() {
  const [gallery, categories] = await Promise.all([
    getGallery().catch(() => [] as Awaited<ReturnType<typeof getGallery>>),
    getAllCategories().catch(() => [] as Category[]),
  ])

  return (
    <>
      {/* Full-width hero — no container constraint */}
      <Hero />

      {/* Book sections */}
      <HomeShowcase />

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="section-divider-heading">
            <span className="text-lg font-bold tracking-[0.15em] uppercase text-charcoal">
              Shop by Category
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                className="group px-6 py-3 border border-beige bg-white hover:border-terracotta hover:bg-terracotta/5 transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-sm font-semibold text-charcoal group-hover:text-terracotta transition-colors uppercase tracking-wide">
                  {cat.name}
                </span>
                <span className="text-terracotta/50 group-hover:text-terracotta transition-colors text-xs">→</span>
              </Link>
            ))}
            <Link
              href="/catalog"
              className="group px-6 py-3 border border-dashed border-beige hover:border-terracotta transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-sm font-medium text-charcoal/40 group-hover:text-terracotta transition-colors">
                View all books
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="section-divider-heading">
            <span className="text-lg font-bold tracking-[0.15em] uppercase text-charcoal">
              Gallery
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map(item => (
              <div key={item.id} className="relative group overflow-hidden aspect-square">
                <Image
                  src={item.url}
                  alt={item.title || 'Gallery image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {item.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                    <span className="text-white text-sm font-medium">{item.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #EBEBEB', borderBottom: '1px solid #EBEBEB' }} className="py-14 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-divider-heading">
            <span className="text-xl font-bold tracking-[0.15em] uppercase text-charcoal">
              What Our Readers Say
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-none p-8 flex flex-col gap-4 shadow-soft border-l-4" style={{ borderLeftColor: '#F07A22' }}>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#F07A22">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-charcoal/80 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="text-sm font-bold text-charcoal">{t.name}</p>
                  <p className="text-xs text-charcoal/50">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSignup />
    </>
  )
}
