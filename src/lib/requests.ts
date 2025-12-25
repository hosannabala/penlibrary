import { db } from './firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore'

export type BookRequest = {
  id: string
  userId: string
  userName: string
  bookTitle: string
  author: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  createdAt: string
}

const requestsRef = collection(db, 'requests')

export async function createRequest(request: Omit<BookRequest, 'id'>) {
  return await addDoc(requestsRef, request)
}

export async function getUserRequests(userId: string): Promise<BookRequest[]> {
  const q = query(requestsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as BookRequest))
}

export async function getAllRequests(): Promise<BookRequest[]> {
  const q = query(requestsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as BookRequest))
}

export async function updateRequestStatus(id: string, status: BookRequest['status']) {
  const docRef = doc(db, 'requests', id)
  await updateDoc(docRef, { status })
}

export async function deleteRequest(id: string) {
  const docRef = doc(db, 'requests', id)
  await deleteDoc(docRef)
}
