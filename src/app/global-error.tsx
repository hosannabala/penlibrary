'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFDF8] text-[#2E2E2E] p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
            <p className="mb-8 text-black/60 max-w-md">{error.message}</p>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-[#E07A5F] text-white rounded-xl hover:bg-[#D0694E] transition-colors"
            >
                Try again
            </button>
        </div>
      </body>
    </html>
  )
}
