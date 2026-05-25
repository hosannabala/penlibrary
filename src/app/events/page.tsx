'use client'
import { useState, useEffect } from 'react'
import { getClubMeetings, rsvpMeeting, hasUserRSVP } from '../../lib/db'
import type { ClubMeeting } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import Link from 'next/link'

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  meetup: 'Meetup',
  discussion: 'Book Discussion',
}

export default function EventsPage() {
  const [events, setEvents] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState<string | null>(null)
  const [rsvpedIds, setRsvpedIds] = useState<Record<string, boolean>>({})
  const [rsvpSuccess, setRsvpSuccess] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    getClubMeetings()
      .then(async data => {
        const filtered = data.filter(m => m.type === 'event' || m.type === 'meetup')
        setEvents(filtered)
        setLoading(false)
        if (user) {
          const checks = await Promise.all(filtered.map(ev => hasUserRSVP(ev.id, user.uid)))
          const map: Record<string, boolean> = {}
          filtered.forEach((ev, i) => { if (checks[i]) map[ev.id] = true })
          setRsvpedIds(map)
        }
      })
      .catch(() => setLoading(false))
  }, [user])

  async function handleRSVP(eventId: string) {
    if (!user) return
    setRsvping(eventId)
    try {
      const already = await hasUserRSVP(eventId, user.uid)
      if (!already) await rsvpMeeting(eventId, user.uid, user.email || undefined)
      setRsvpedIds(prev => ({ ...prev, [eventId]: true }))
      setRsvpSuccess(eventId)
      setTimeout(() => setRsvpSuccess(null), 3000)
    } catch {
      // silently fail — RSVP is non-critical
    } finally {
      setRsvping(null)
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8" style={{ backgroundColor: '#1E3777' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14 md:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-0.5" style={{ backgroundColor: '#F07A22' }} />
              <p className="text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">Pen Library</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              Seminars &amp; Events
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Transformative sessions on leadership, career development, and personal growth. Join us in person or online.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#F5F5F5] h-56" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#EBEBEB]">
            <div className="w-16 h-16 border-2 border-[#EBEBEB] flex items-center justify-center mx-auto mb-6">
              <CalendarIcon />
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-3">No Upcoming Events</h2>
            <p className="text-charcoal/50 text-sm mb-8 max-w-xs mx-auto">
              Check back soon — or join our Book Club for regular monthly meetups and discussions.
            </p>
            <Link
              href="/club"
              className="inline-block px-8 py-3 text-white font-bold text-sm uppercase tracking-widest"
              style={{ backgroundColor: '#F07A22' }}
            >
              Join Book Club
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map(event => {
              const d = new Date(event.date)
              const isOnline = (event.location ?? '').startsWith('http')
              const registered = rsvpedIds[event.id]

              return (
                <div key={event.id} className="border border-[#EBEBEB] bg-white flex flex-col">
                  {/* Date bar */}
                  <div className="flex items-center justify-between px-6 py-3 border-b border-[#EBEBEB]" style={{ backgroundColor: '#1E3777' }}>
                    <span className="text-white font-bold text-sm uppercase tracking-widest">
                      {d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-white/50 text-xs uppercase tracking-wide font-medium border border-white/20 px-2 py-0.5">
                      {TYPE_LABELS[event.type] ?? event.type}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <h3 className="text-xl font-bold text-charcoal leading-snug">{event.title}</h3>
                    <p className="text-charcoal/65 text-sm leading-relaxed line-clamp-3">{event.description}</p>

                    <div className="flex flex-col gap-2 text-sm text-charcoal/60">
                      {event.time && (
                        <span className="flex items-center gap-2">
                          <ClockIcon /> {event.time}
                        </span>
                      )}
                      {event.location && (
                        isOnline ? (
                          <span className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                            Online Event
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <PinIcon /> {event.location}
                          </span>
                        )
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-[#EBEBEB]">
                      {rsvpSuccess === event.id && (
                        <p className="text-sm font-medium text-green-700 mb-3">You&apos;re registered!</p>
                      )}
                      {user ? (
                        isOnline && event.location ? (
                          <div className="flex gap-3">
                            <a
                              href={event.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-3 text-center text-white text-sm font-bold uppercase tracking-widest"
                              style={{ backgroundColor: '#F07A22' }}
                            >
                              Join Online
                            </a>
                            {!registered && (
                              <button
                                onClick={() => handleRSVP(event.id)}
                                disabled={rsvping === event.id}
                                className="px-4 py-3 border border-charcoal/20 text-charcoal text-sm font-bold uppercase tracking-wide hover:border-charcoal transition-colors"
                              >
                                RSVP
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRSVP(event.id)}
                            disabled={registered || rsvping === event.id}
                            className="w-full py-3 text-sm font-bold uppercase tracking-widest transition-colors text-white"
                            style={{ backgroundColor: registered ? '#4b7c52' : '#1E3777' }}
                          >
                            {registered ? 'Registered' : rsvping === event.id ? 'Registering...' : 'Register Now'}
                          </button>
                        )
                      ) : (
                        <p className="text-xs text-charcoal/40">
                          <Link href="/" className="underline hover:text-charcoal">Sign in</Link> to RSVP for this event.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Book club CTA */}
        <div className="mt-16 p-10 md:p-14 text-center border border-[#EBEBEB]">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#F07A22' }}>Every Month</p>
          <h2 className="text-2xl font-bold text-charcoal mb-3">Looking for regular meetups?</h2>
          <p className="text-charcoal/60 text-sm mb-8 max-w-sm mx-auto">
            Our Book Club runs monthly discussions, reading challenges, and community sessions.
          </p>
          <Link
            href="/club"
            className="inline-block px-8 py-4 text-white font-bold text-sm uppercase tracking-widest"
            style={{ backgroundColor: '#F07A22' }}
          >
            Explore Book Club
          </Link>
        </div>
      </div>
    </>
  )
}
