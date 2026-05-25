'use client'
import { useState, useEffect } from 'react'
import { getClubMeetings, addClubMember, rsvpMeeting, hasUserRSVP } from '../../lib/db'
import type { ClubMeeting } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    title: 'Monthly Reads',
    body: 'Curated books to challenge your perspective and fuel your growth.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Live Discussions',
    body: 'Engaging conversations with fellow readers and occasional guest authors.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Community Events',
    body: 'Networking meetups, book swaps, and social gatherings.',
  },
]

const MEETING_TYPE_LABELS: Record<string, string> = {
  discussion: 'Book Discussion',
  event: 'Social Event',
  meetup: 'Meetup',
}

export default function ClubPage() {
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [joinEmail, setJoinEmail] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [rsvping, setRsvping] = useState<string | null>(null)
  const [rsvpedIds, setRsvpedIds] = useState<Record<string, boolean>>({})
  const { user } = useAuth()
  const { whatsapp_community_url, email } = useSiteSettings()

  useEffect(() => {
    getClubMeetings()
      .then(data => { setMeetings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user?.email) setJoinEmail(user.email)
  }, [user])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinEmail.trim()) return
    setJoining(true)
    try {
      await addClubMember(joinEmail.trim(), user?.uid)
      setJoined(true)
    } catch {
      // silently fail
    } finally {
      setJoining(false)
    }
  }

  async function handleRSVP(meetingId: string) {
    if (!user?.uid) return
    setRsvping(meetingId)
    try {
      const already = await hasUserRSVP(meetingId, user.uid)
      if (!already) await rsvpMeeting(meetingId, user.uid, user.email || undefined)
      setRsvpedIds(prev => ({ ...prev, [meetingId]: true }))
    } catch {
      // silently fail
    } finally {
      setRsvping(null)
    }
  }

  return (
    <div className="py-10">

      {/* Hero */}
      <div
        className="-mx-4 sm:-mx-6 lg:-mx-8 mb-14 py-16 px-4 text-center relative overflow-hidden"
        style={{ backgroundColor: '#1E3777' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#F07A22' }} />
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-4" style={{ color: '#F07A22' }}>Community</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Pen Library Book Club</h1>
        <p className="text-white/55 max-w-xl mx-auto text-base">
          Read. Discuss. Grow together.
        </p>
      </div>

      {/* Feature tiles */}
      <div className="grid md:grid-cols-3 gap-5 mb-14">
        {FEATURES.map((f, i) => (
          <div key={i} className="border border-[#EBEBEB] p-7">
            <div className="mb-4" style={{ color: '#F07A22' }}>{f.icon}</div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-2">{f.title}</h3>
            <p className="text-sm text-charcoal/60 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      {/* Join form */}
      <div id="join" className="border border-[#EBEBEB] p-8 mb-14 max-w-2xl mx-auto">
        <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-1">Join the Book Club</h2>
        <p className="text-sm text-charcoal/50 mb-6">Get updates on monthly reads, events and discussions.</p>
        {joined ? (
          <p className="text-green-700 font-semibold text-sm">You&apos;re on the list — watch your inbox.</p>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-0">
            <input
              type="email"
              value={joinEmail}
              onChange={e => setJoinEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 px-4 py-3 border border-[#EBEBEB] text-sm focus:outline-none focus:border-charcoal/40 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={joining}
              className="px-6 py-3 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
              style={{ backgroundColor: '#F07A22' }}
            >
              {joining ? 'Joining…' : 'Join via Email'}
            </button>
            <a
              href={whatsapp_community_url || 'https://wa.me/'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-white text-[11px] font-bold uppercase tracking-widest text-center transition-opacity hover:opacity-90 shrink-0"
              style={{ backgroundColor: '#25D366' }}
            >
              Join WhatsApp
            </a>
          </form>
        )}
      </div>

      {/* Meetings */}
      <div className="max-w-4xl mx-auto">
        <div className="section-divider-heading mb-6">
          <span className="text-base font-bold tracking-[0.12em] uppercase text-charcoal">Upcoming Events</span>
        </div>

        {loading ? (
          <p className="text-sm text-charcoal/50 py-8 text-center">Loading schedule…</p>
        ) : meetings.length === 0 ? (
          <div className="border border-dashed border-[#EBEBEB] py-16 text-center">
            <p className="text-charcoal/50 text-sm">No upcoming meetings scheduled.</p>
            <p className="text-xs text-charcoal/30 mt-1">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map(meeting => (
              <div key={meeting.id} className="border border-[#EBEBEB] flex flex-col md:flex-row">
                {/* Date block */}
                <div
                  className="shrink-0 flex md:flex-col items-center justify-center gap-2 md:gap-0 px-6 py-4 md:py-6 min-w-[90px]"
                  style={{ backgroundColor: '#1E3777' }}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-bold text-white leading-none">
                    {new Date(meeting.date).getDate()}
                  </span>
                  {meeting.time && (
                    <span className="text-[10px] text-white/40 mt-1">{meeting.time}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border"
                      style={{ color: '#F07A22', borderColor: '#F07A22' }}
                    >
                      {MEETING_TYPE_LABELS[meeting.type] ?? meeting.type}
                    </span>
                    {meeting.location && (
                      <span className="text-[10px] text-charcoal/40 uppercase tracking-wide">
                        {(meeting.location).startsWith('http') ? 'Online' : meeting.location}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-charcoal mb-1">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-sm text-charcoal/60 mb-4 leading-relaxed">{meeting.description}</p>
                  )}
                  {meeting.bookTitle && (
                    <p className="text-xs text-charcoal/50 mb-4">
                      Reading: <span className="font-semibold text-charcoal">{meeting.bookTitle}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {(meeting.location ?? '').startsWith('http') && (
                      <a
                        href={meeting.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#1E3777' }}
                      >
                        Join Online
                      </a>
                    )}
                    {user && (
                      <button
                        onClick={() => handleRSVP(meeting.id)}
                        disabled={!!rsvpedIds[meeting.id] || rsvping === meeting.id}
                        className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border transition-colors disabled:opacity-60"
                        style={rsvpedIds[meeting.id]
                          ? { backgroundColor: '#F07A22', borderColor: '#F07A22', color: 'white' }
                          : { borderColor: '#EBEBEB', color: '#2E2E2E' }}
                      >
                        {rsvpedIds[meeting.id] ? 'RSVP\'d' : rsvping === meeting.id ? 'RSVPing…' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div
        className="-mx-4 sm:-mx-6 lg:-mx-8 mt-16 py-14 px-4 text-center"
        style={{ backgroundColor: '#1E3777' }}
      >
        <h2 className="text-2xl font-bold text-white mb-3">Starting a reading circle?</h2>
        <p className="text-white/60 text-sm mb-8 max-w-md mx-auto">
          We support local reading groups with book discounts and discussion guides.
        </p>
        <a
          href={`mailto:${email}`}
          className="inline-block px-8 py-3.5 text-white text-[11px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#F07A22' }}
        >
          Contact Us
        </a>
      </div>
    </div>
  )
}
