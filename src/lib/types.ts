export type UserProfile = {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  xp: number
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  streak: number
  badges: string[]
}

export type Book = {
  id: string
  title: string
  author: string
  price: number
  costPrice?: number
  category: string
  coverUrl?: string
  description?: string
  featured?: boolean
  stock: number
}

export type CartItem = {
  book: Book
  quantity: number
}

export type EventItem = {
  id: string
  title: string
  date: string
  location: string
  price?: number
  description?: string
  speaker?: string
}

export type Consultation = {
  id: string
  topic: string
  requesterUid: string
  schedule: string
  notes?: string
  status: 'requested' | 'scheduled' | 'completed'
}

export type Order = {
  id: string
  userId: string
  items: CartItem[]
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
  customerName?: string
  customerEmail?: string
}

export type Category = {
  id: string
  name: string
  slug: string
}

export type ClubMeeting = {
  id: string
  title: string
  date: string
  time: string
  location: string // e.g., "Google Meet" or physical address
  bookId?: string // Optional linked book
  bookTitle?: string
  description: string
  meetingLink?: string
  type: 'discussion' | 'event' | 'meetup'
}

export type ClubMember = {
  id: string
  email: string
  uid?: string
  joinedAt: string
}

export type ClubRSVP = {
  id: string
  meetingId: string
  uid: string
  email?: string
  createdAt: string
}
