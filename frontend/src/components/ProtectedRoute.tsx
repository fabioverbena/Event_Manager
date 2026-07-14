import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { firebaseAuth, firebaseDb } from '@/lib/firebase'

function getOperatorDocId(user: User) {
  return user.phoneNumber || user.email || null
}

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async nextUser => {
      try {
        setUnauthorized(false)

        if (!nextUser) {
          setUser(null)
          setLoading(false)
          return
        }

        const operatorDocId = getOperatorDocId(nextUser)
        if (!operatorDocId) {
          await signOut(firebaseAuth)
          setUser(null)
          setUnauthorized(true)
          setLoading(false)
          return
        }

        const operatorRef = doc(firebaseDb, 'operators', operatorDocId)
        const operatorSnap = await getDoc(operatorRef)
        const isActive = operatorSnap.exists() && operatorSnap.data()?.active === true

        if (!isActive) {
          await signOut(firebaseAuth)
          setUser(null)
          setUnauthorized(true)
          setLoading(false)
          return
        }

        setUser(nextUser)
        setLoading(false)
      } catch {
        try {
          await signOut(firebaseAuth)
        } catch {
          // ignore
        }
        setUser(null)
        setUnauthorized(true)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">Caricamento…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, unauthorized: unauthorized ? true : undefined }}
      />
    )
  }

  return <>{children}</>
}
