import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, where } from 'firebase/firestore'
import { db } from './firebase'
import type { Book, Category, ClubMeeting, ClubMember, ClubRSVP } from './types'

export const booksRef = collection(db, 'books')
export const categoriesRef = collection(db, 'categories')
export const clubRef = collection(db, 'club_meetings')
export const clubMembersRef = collection(db, 'club_members')
export const clubRsvpsRef = collection(db, 'club_rsvps')

export async function getAllBooks(): Promise<Book[]> {
  const snapshot = await getDocs(booksRef)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Book))
}

export async function getBook(id: string): Promise<Book | null> {
  const ref = doc(db, 'books', id)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Book
}

export async function addBook(book: Omit<Book, 'id'>) {
  return await addDoc(booksRef, book)
}

export async function updateBook(id: string, updates: Partial<Book>) {
  const ref = doc(db, 'books', id)
  return await updateDoc(ref, updates)
}

export async function deleteBook(id: string) {
  const ref = doc(db, 'books', id)
  return await deleteDoc(ref)
}

// Categories
export async function getAllCategories(): Promise<Category[]> {
    const q = query(categoriesRef, orderBy('name'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Category))
}

export async function addCategory(name: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    return await addDoc(categoriesRef, { name, slug })
}

export async function deleteCategory(id: string) {
    const ref = doc(db, 'categories', id)
    return await deleteDoc(ref)
}

// Club Meetings
export async function getClubMeetings(): Promise<ClubMeeting[]> {
    const q = query(clubRef, orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ClubMeeting))
}

export async function addClubMeeting(meeting: Omit<ClubMeeting, 'id'>) {
    return await addDoc(clubRef, meeting)
}

export async function updateClubMeeting(id: string, updates: Partial<ClubMeeting>) {
    const ref = doc(db, 'club_meetings', id)
    return await updateDoc(ref, updates)
}

export async function deleteClubMeeting(id: string) {
    const ref = doc(db, 'club_meetings', id)
    return await deleteDoc(ref)
}

// Club Members
export async function addClubMember(email: string, uid?: string) {
    return await addDoc(clubMembersRef, { email, uid, joinedAt: new Date().toISOString() })
}

// RSVPs
export async function rsvpMeeting(meetingId: string, uid: string, email?: string) {
    return await addDoc(clubRsvpsRef, { meetingId, uid, email, createdAt: new Date().toISOString() })
}

export async function hasUserRSVP(meetingId: string, uid: string): Promise<boolean> {
    const q = query(clubRsvpsRef, where('meetingId', '==', meetingId), where('uid', '==', uid))
    const snapshot = await getDocs(q)
    return snapshot.size > 0
}
