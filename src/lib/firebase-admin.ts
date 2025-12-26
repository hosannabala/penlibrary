import 'server-only'
import * as admin from 'firebase-admin'

interface FirebaseAdminConfig {
  projectId: string
  clientEmail: string
  privateKey: string
}

function formatPrivateKey(key: string) {
  // Remove any surrounding quotes
  let formattedKey = key.replace(/^"|"$/g, '')
  
  // Replace literal \n with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, '\n')
  
  // Ensure the key has the correct headers if missing
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}`
  }
  if (!formattedKey.includes('-----END PRIVATE KEY-----')) {
    formattedKey = `${formattedKey}\n-----END PRIVATE KEY-----\n`
  }
  
  return formattedKey
}

export function createFirebaseAdminApp(config: FirebaseAdminConfig) {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: formatPrivateKey(config.privateKey),
    }),
  })
}

export function getAdminFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials')
  }

  const app = createFirebaseAdminApp({
    projectId,
    clientEmail,
    privateKey,
  })

  return app.firestore()
}
