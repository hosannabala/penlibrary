import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-[80px] font-bold leading-none" style={{ color: '#F07A22' }}>404</p>
      <h1 className="text-2xl font-bold text-charcoal mt-2 mb-3">Page Not Found</h1>
      <p className="text-charcoal/50 text-sm max-w-sm mb-8">
        We couldn&apos;t find what you were looking for. It may have been moved or removed.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/catalog"
          className="px-7 py-3 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#F07A22' }}
        >
          Browse Books
        </Link>
        <Link
          href="/"
          className="px-7 py-3 border border-[#EBEBEB] text-charcoal text-[11px] font-bold uppercase tracking-widest hover:border-charcoal/30 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
