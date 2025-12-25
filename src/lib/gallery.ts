import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

export type GalleryItem = {
  id: string
  url: string
  title?: string
}

const galleryRef = collection(db, 'gallery')

export async function getGallery(): Promise<GalleryItem[]> {
  const snapshot = await getDocs(galleryRef)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GalleryItem))
}

export async function addGalleryItem(url: string, title?: string) {
  return await addDoc(galleryRef, { url, title, createdAt: new Date().toISOString() })
}

export async function deleteGalleryItem(id: string) {
  return await deleteDoc(doc(db, 'gallery', id))
}
