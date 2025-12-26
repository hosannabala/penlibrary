'use server'

import { getAdminFirestore } from '@/lib/firebase-admin'

export async function checkAdminStatus(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  
  // 1. Check Hardcoded List (Legacy/Fallback)
  const LEGACY_ADMINS = [
    'admin@penlibrary.com',
    'hosannabala4u@gmail.com'
  ]
  if (LEGACY_ADMINS.includes(email)) return true

  // 2. Check Firestore 'admins' collection
  try {
    const db = getAdminFirestore()
    const adminsRef = db.collection('admins')
    const q = await adminsRef.where('email', '==', email).limit(1).get()
    
    return !q.empty
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function addAdmin(email: string, addedBy: string) {
    const db = getAdminFirestore()
    const adminsRef = db.collection('admins')
    
    // Check if already exists
    const q = await adminsRef.where('email', '==', email).limit(1).get()
    if (!q.empty) {
        return { success: false, message: 'User is already an admin' }
    }
    
    await adminsRef.add({
        email,
        addedBy,
        addedAt: new Date().toISOString()
    })
    
    return { success: true, message: 'Admin added successfully' }
}

export async function removeAdmin(email: string) {
    const db = getAdminFirestore()
    const adminsRef = db.collection('admins')
    
    const q = await adminsRef.where('email', '==', email).limit(1).get()
    if (q.empty) {
        return { success: false, message: 'Admin not found' }
    }
    
    const docId = q.docs[0].id
    await adminsRef.doc(docId).delete()
    
    return { success: true, message: 'Admin removed successfully' }
}

export async function getAdmins() {
    const db = getAdminFirestore()
    const adminsRef = db.collection('admins')
    const snapshot = await adminsRef.get()
    
    const firestoreAdmins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // Combine with legacy
    const legacyAdmins = [
        { email: 'admin@penlibrary.com', type: 'system' },
        { email: 'hosannabala4u@gmail.com', type: 'system' }
    ]
    
    return { firestoreAdmins, legacyAdmins }
}
