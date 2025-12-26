'use client'
import { useState, useEffect } from 'react'
import { getClubMeetings, rsvpMeeting, hasUserRSVP } from '../../lib/db'
import type { ClubMeeting } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'

export default function EventsPage() {
  const [events, setEvents] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState<string | null>(null)
  const [rsvpedIds, setRsvpedIds] = useState<Record<string, boolean>>({})
  const { user } = useAuth()

  useEffect(() => {
    getClubMeetings().then(data => {
      // Filter for general events/meetups, excluding simple book discussions if desired
      // Or just show all 'event' and 'meetup' types
      const filtered = data.filter(m => m.type === 'event' || m.type === 'meetup')
      setEvents(filtered)
      setLoading(false)
      
      // Check RSVPs
      if (user) {
        filtered.forEach(async (ev) => {
            const has = await hasUserRSVP(ev.id, user.uid)
            if (has) setRsvpedIds(prev => ({ ...prev, [ev.id]: true }))
        })
      }
    })
  }, [user])

  async function handleRSVP(eventId: string) {
    if (!user) return alert('Please log in to RSVP')
    setRsvping(eventId)
    try {
      const already = await hasUserRSVP(eventId, user.uid)
      if (!already) {
        await rsvpMeeting(eventId, user.uid, user.email || undefined)
      }
      setRsvpedIds(prev => ({ ...prev, [eventId]: true }))
      alert('You have successfully RSVP\'d!')
    } catch (e) {
      console.error(e)
      alert('Failed to RSVP')
    } finally {
      setRsvping(null)
    }
  }

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-terracotta">Seminars & Workshops</h2>
            <p className="text-charcoal/70">Join us for transformative sessions on leadership, career, and personal growth.</p>
        </div>
        
        {loading ? (
            <div className="text-center py-12 text-charcoal/50">Loading events...</div>
        ) : events.length === 0 ? (
            <div className="text-center py-12 bg-offwhite rounded-3xl border border-beige/50">
                <p className="text-charcoal/60 mb-4">No upcoming seminars scheduled at the moment.</p>
                <p className="text-sm text-charcoal/40">Check back later or join our Book Club for regular meetups.</p>
            </div>
        ) : (
            <div className="grid md:grid-cols-2 gap-6">
                {events.map(event => (
                    <div key={event.id} className="card p-6 flex flex-col hover:shadow-lg transition-all border-l-4 border-terracotta bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-charcoal mb-1">{event.title}</h3>
                                <div className="text-sm font-medium text-terracotta uppercase tracking-wide">{event.type}</div>
                            </div>
                            <div className="text-center bg-offwhite p-2 rounded-lg min-w-[60px]">
                                <div className="text-xs font-bold text-charcoal/60 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                                <div className="text-xl font-bold text-charcoal">{new Date(event.date).getDate()}</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-6 text-sm text-charcoal/70 flex-1">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {event.time}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {event.location}
                            </div>
                            <p className="pt-2 line-clamp-3">{event.description}</p>
                        </div>

                        <button 
                            onClick={() => handleRSVP(event.id)}
                            disabled={rsvpedIds[event.id] || rsvping === event.id}
                            className={`w-full py-3 rounded-xl font-medium transition-colors ${
                                rsvpedIds[event.id] 
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-terracotta text-white hover:bg-terracotta/90'
                            }`}
                        >
                            {rsvpedIds[event.id] ? 'Registered' : (rsvping === event.id ? 'Registering...' : 'Register Now')}
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
