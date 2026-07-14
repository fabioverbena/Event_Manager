import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function requireEnv(name: keyof ImportMetaEnv) {
  const value = import.meta.env[name]
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new Error(`Missing env var: ${name}`)
  if (normalized === 'your_api_key' || normalized === 'your_project_id' || normalized === 'your_app_id') {
    throw new Error(`Env var ${name} is still set to a placeholder value. Update frontend/.env and restart the dev server.`)
  }
  return normalized
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDb = getFirestore(firebaseApp)
