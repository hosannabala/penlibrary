export default function Footer() {
  return (
    <footer className="border-t border-beige bg-offwhite">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm flex flex-col items-center text-center gap-6">
        <div className="space-y-2">
          <div className="font-bold text-lg text-terracotta">Pen Library Services</div>
          <div className="text-charcoal/70">Okuru-Ama, Port Harcourt, Rivers State, Nigeria</div>
          <div className="italic font-medium text-charcoal">"Knowledge Covers the Earth"</div>
        </div>
        
        <div className="flex gap-6 font-medium">
          <a href="https://instagram.com/pen_library_services" target="_blank" rel="noreferrer" className="hover:text-terracotta transition-colors">Instagram</a>
          <a href="/about" className="hover:text-terracotta transition-colors">About</a>
          <a href="/contact" className="hover:text-terracotta transition-colors">Contact</a>
        </div>

        <div className="text-charcoal/40 text-xs">
          © {new Date().getFullYear()} Pen Library Services. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
