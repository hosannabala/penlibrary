import Hero from '../components/Hero'
import Link from 'next/link'
import Image from 'next/image'
import { getGallery } from '../lib/gallery'

export default async function Page() {
  const gallery = await getGallery()

  return (
    <>
      <Hero />
      
      <section className="mb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4 text-terracotta">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m2 12 5-5 5 5-5 5Z"/><path d="m12 12 5-5 5 5-5 5Z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-terracotta">Mission</h3>
              <p className="text-charcoal/80 leading-relaxed">To rekindle and promote a reading culture that inspires consistent personal growth.</p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4 text-terracotta">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-terracotta">Vision</h3>
              <p className="text-charcoal/80 leading-relaxed">To cause a paradigm shift and impact the world through books, seminars, and consultation.</p>
            </div>
            
            <div className="card p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4 text-terracotta">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-terracotta">Values</h3>
              <p className="text-charcoal/80 leading-relaxed">Integrity • Team-Spirit • Discipline • Dedication • Diligence</p>
            </div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mb-20 max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map(item => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square hover:shadow-lg transition-all">
                <Image 
                  src={item.url} 
                  alt={item.title || "Gallery image"} 
                  fill
                  className="object-cover transform group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {item.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                    <span className="text-white font-medium">{item.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/catalog" className="group">
            <div className="card p-6 h-full hover:shadow-xl transition-all duration-300 border-b-4 border-transparent hover:border-terracotta flex flex-col items-center text-center">
              <h3 className="text-xl font-semibold mb-3 group-hover:text-terracotta transition-colors">Book Sales</h3>
              <p className="text-charcoal/70">Curated Christian, motivational, business, leadership and career books for your growth.</p>
            </div>
          </Link>
          
          <Link href="/club#join" className="group">
            <div className="card p-6 h-full hover:shadow-xl transition-all duration-300 border-b-4 border-transparent hover:border-terracotta flex flex-col items-center text-center">
              <h3 className="text-xl font-semibold mb-3 group-hover:text-terracotta transition-colors">Book Club</h3>
              <p className="text-charcoal/70">Join our community for monthly reading challenges, discussion threads and meetups.</p>
              <span className="mt-3 inline-block px-4 py-2 rounded-xl bg-terracotta text-white text-sm">Join Now</span>
            </div>
          </Link>
          
          <Link href="/consulting" className="group">
            <div className="card p-6 h-full hover:shadow-xl transition-all duration-300 border-b-4 border-transparent hover:border-terracotta flex flex-col items-center text-center">
              <h3 className="text-xl font-semibold mb-3 group-hover:text-terracotta transition-colors">Consulting</h3>
              <p className="text-charcoal/70">Professional workshops, events and tailored business consultation services.</p>
            </div>
          </Link>
        </div>
      </section>
    </>
  )
}
