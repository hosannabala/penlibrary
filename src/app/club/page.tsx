'use client'
import { useState, useEffect } from 'react'
import { getClubMeetings, addClubMember, rsvpMeeting, hasUserRSVP } from '../../lib/db'
import type { ClubMeeting } from '../../lib/types'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function ClubPage() {
  const [meetings, setMeetings] = useState<ClubMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [joinEmail, setJoinEmail] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [rsvping, setRsvping] = useState<string | null>(null)
  const [rsvpedIds, setRsvpedIds] = useState<Record<string, boolean>>({})
  const { user } = useAuth()

  useEffect(() => {
    getClubMeetings().then(data => {
      setMeetings(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
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
    } catch (e) {
      console.error(e)
    } finally {
      setJoining(false)
    }
  }

  async function handleRSVP(meetingId: string) {
    if (!user?.uid) return alert('Please log in to RSVP')
    setRsvping(meetingId)
    try {
      const already = await hasUserRSVP(meetingId, user.uid)
      if (!already) {
        await rsvpMeeting(meetingId, user.uid, user.email || undefined)
      }
      setRsvpedIds(prev => ({ ...prev, [meetingId]: true }))
    } catch (e) {
      console.error(e)
    } finally {
      setRsvping(null)
    }
  }

  return (
    <div className="py-12">
      <div id="join" className="max-w-3xl mx-auto mb-12">
        <div className="card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2">Join the Book Club</h2>
          <p className="text-charcoal/70 mb-4">Get updates on monthly reads, events and discussions.</p>
          <form onSubmit={handleJoin} className="flex flex-col md:flex-row gap-3">
            <input 
              type="email"
              value={joinEmail}
              onChange={e => setJoinEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 p-3 border border-beige rounded-xl"
              required
            />
            <button type="submit" className="px-5 py-3 rounded-xl bg-terracotta text-white" disabled={joining}>
              {joining ? 'Joining...' : (joined ? 'Joined' : 'Join via Email')}
            </button>
            <a 
              href={(process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL as string) || 'https://wa.me/'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-5 py-3 rounded-xl bg-green-600 text-white text-center"
            >
              Join WhatsApp
            </a>
          </form>
          {joined && <p className="text-green-700 mt-2 text-sm">Thanks! You’re on the list — watch your inbox.</p>}
        </div>
      </div>
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-terracotta mb-4">Pen Library Book Club</h1>
        <p className="text-xl text-charcoal/70 max-w-2xl mx-auto">
          Join our community of readers. We read, discuss, and grow together.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card p-8 bg-terracotta text-white shadow-lg transform hover:-translate-y-1 transition-transform">
          <div className="text-3xl mb-4">📖</div>
          <h3 className="text-xl font-bold mb-2">Monthly Reads</h3>
          <p className="opacity-90">Curated books to challenge your perspective and fuel your growth.</p>
        </div>
        <div className="card p-8 bg-charcoal text-white shadow-lg transform hover:-translate-y-1 transition-transform">
          <div className="text-3xl mb-4">💬</div>
          <h3 className="text-xl font-bold mb-2">Live Discussions</h3>
          <p className="opacity-90">Engaging conversations with fellow readers and occasional guest authors.</p>
        </div>
        <div className="card p-8 bg-sage text-charcoal shadow-lg transform hover:-translate-y-1 transition-transform">
          <div className="text-3xl mb-4">🤝</div>
          <h3 className="text-xl font-bold mb-2">Community Events</h3>
          <p className="opacity-90">Networking meetups, book swaps, and social gatherings.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <span className="w-2 h-8 bg-terracotta rounded-full"></span>
          Upcoming Events & Meetings
        </h2>
        
        {loading ? (
            <div className="text-center py-12">Loading schedule...</div>
        ) : meetings.length === 0 ? (
            <div className="text-center py-16 bg-offwhite/50 rounded-3xl border border-dashed border-beige">
                <p className="text-charcoal/60 text-lg">No upcoming meetings scheduled at the moment.</p>
                <p className="text-sm text-charcoal/40 mt-2">Check back soon for new updates!</p>
            </div>
        ) : (
            <div className="space-y-6">
                {meetings.map((meeting, index) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={meeting.id} 
                        className="card p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex-shrink-0 flex md:flex-col items-center justify-center bg-offwhite rounded-2xl p-4 min-w-[100px] border border-beige">
                            <span className="text-sm font-bold text-terracotta uppercase tracking-wider">{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-3xl font-bold text-charcoal">{new Date(meeting.date).getDate()}</span>
                            <span className="text-xs text-charcoal/60">{meeting.time}</span>
                        </div>
                        
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    meeting.type === 'discussion' ? 'bg-blue-100 text-blue-800' :
                                    meeting.type === 'event' ? 'bg-purple-100 text-purple-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {meeting.type === 'discussion' ? 'Book Discussion' : meeting.type === 'event' ? 'Social Event' : 'Meetup'}
                                </span>
                                {meeting.location.startsWith('http') ? (
                                    <span className="text-xs flex items-center gap-1 text-charcoal/60">
                                        🎥 Online
                                    </span>
                                ) : (
                                    <span className="text-xs flex items-center gap-1 text-charcoal/60">
                                        📍 In-Person
                                    </span>
                                )}
                            </div>
                            
                            <h3 className="text-xl font-bold mb-2">{meeting.title}</h3>
                            <p className="text-charcoal/70 mb-4">{meeting.description}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                                {meeting.location && (
                                    <div className="flex items-center gap-2">
                                        {meeting.location.startsWith('http') ? (
                                            <a href={meeting.location} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 transition-colors">
                                                <span>🎥</span>
                                                <span>Join Meeting</span>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-offwhite px-3 py-1.5 rounded-lg text-charcoal/80">
                                                <span>📍</span>
                                                <span>{meeting.location}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {meeting.bookTitle && (
                                    <div className="flex items-center gap-2 bg-offwhite px-3 py-1.5 rounded-lg text-charcoal/80">
                                        <span>📖</span>
                                        <span>Reading: <strong>{meeting.bookTitle}</strong></span>
                                    </div>
                                )}
                                {user && (
                                  <button 
                                    onClick={() => handleRSVP(meeting.id)} 
                                    disabled={!!rsvpedIds[meeting.id] || rsvping === meeting.id}
                                    className={`px-4 py-2 rounded-xl ${rsvpedIds[meeting.id] ? 'bg-green-600 text-white' : 'bg-charcoal text-white hover:bg-charcoal/90'} transition-colors`}
                                  >
                                    {rsvpedIds[meeting.id] ? 'RSVP’d' : (rsvping === meeting.id ? 'RSVPing...' : 'RSVP')}
                                  </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      <div className="mt-20 bg-charcoal text-white rounded-3xl p-8 md:p-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Want to start your own reading circle?</h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          We support local reading groups with book discounts and discussion guides.
        </p>
        <a href="mailto:community@penlibrary.com" className="inline-block px-8 py-3 bg-terracotta text-white rounded-xl font-semibold hover:bg-terracotta/90 transition-colors">
          Contact Us
        </a>
      </div>
    </div>
  )
}
