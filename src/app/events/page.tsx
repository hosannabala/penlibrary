export default function EventsPage() {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-4">Seminars & Workshops</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <div className="font-semibold">Leadership Summit</div>
          <div className="text-sm">Port Harcourt • 12 Feb</div>
          <button className="mt-3 px-4 py-2 rounded-2xl bg-terracotta text-white">RSVP</button>
        </div>
        <div className="card p-4">
          <div className="font-semibold">Career Workshop</div>
          <div className="text-sm">Online • 26 Mar</div>
          <button className="mt-3 px-4 py-2 rounded-2xl bg-terracotta text-white">Buy Ticket</button>
        </div>
      </div>
    </div>
  )
}
