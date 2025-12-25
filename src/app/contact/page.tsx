export default function ContactPage() {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-4">Contact</h2>
      <form className="card p-4 grid gap-3 max-w-xl">
        <input className="border rounded-2xl p-3" placeholder="Name" />
        <input className="border rounded-2xl p-3" placeholder="Email" />
        <textarea className="border rounded-2xl p-3" placeholder="Message" rows={4} />
        <button className="px-5 py-3 rounded-2xl bg-terracotta text-white">Send</button>
      </form>
      <div className="mt-8">
        <iframe
          className="w-full h-64 rounded-2xl"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=Okuru-Ama,+Port+Harcourt&output=embed"
        />
      </div>
    </div>
  )
}
