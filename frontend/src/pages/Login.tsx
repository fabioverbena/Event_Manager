import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { firebaseAuth, firebaseDb } from '@/lib/firebase'

function getOperatorDocIdFromUser(user: { phoneNumber: string | null; email: string | null }) {
  return user.phoneNumber || user.email || null
}

function normalizePhone(input: string) {
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('39')) return `+${digits}`
  if (digits.length === 10) return `+39${digits}`
  return `+${digits}`
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recaptchaContainerId = useMemo(
    () => `recaptcha-container-${Math.random().toString(36).slice(2)}`,
    []
  )

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    if (method !== 'phone') return
    if (step !== 'phone') return

    if (recaptchaVerifierRef.current) return

    recaptchaVerifierRef.current = new RecaptchaVerifier(
      firebaseAuth,
      recaptchaContainerId,
      {
        size: 'invisible',
      }
    )

    return () => {
      recaptchaVerifierRef.current?.clear()
      recaptchaVerifierRef.current = null
    }
  }, [recaptchaContainerId, step])

  const redirectTo = (location.state as any)?.from?.pathname || '/dashboard'

  const checkWhitelistOrThrow = async (user: { phoneNumber: string | null; email: string | null }) => {
    const operatorDocId = getOperatorDocIdFromUser(user)
    if (!operatorDocId) throw new Error('Identificativo utente non disponibile')

    const operatorRef = doc(firebaseDb, 'operators', operatorDocId)
    const operatorSnap = await getDoc(operatorRef)

    const isActive = operatorSnap.exists() && operatorSnap.data()?.active === true
    if (!isActive) {
      await signOut(firebaseAuth)
      throw new Error('Utente non autorizzato')
    }
  }

  const handleSendCode = async () => {
    try {
      setLoading(true)
      setError(null)

      const verifier = recaptchaVerifierRef.current
      if (!verifier) throw new Error('reCAPTCHA non inizializzato')

      const normalized = normalizePhone(phone)
      const result = await signInWithPhoneNumber(firebaseAuth, normalized, verifier)

      setConfirmation(result)
      setStep('code')
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Errore invio codice'
      setError(message)

      try {
        recaptchaVerifierRef.current?.clear()
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!confirmation) throw new Error('Sessione OTP non valida, riprova')
      const cred = await confirmation.confirm(code.trim())

      await checkWhitelistOrThrow({
        phoneNumber: cred.user.phoneNumber,
        email: cred.user.email,
      })

      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Errore verifica codice'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const cred = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password
      )

      await checkWhitelistOrThrow({
        phoneNumber: cred.user.phoneNumber,
        email: cred.user.email,
      })

      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof FirebaseError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Errore login'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Accedi</h1>
          <p className="text-sm text-gray-600">Scegli un metodo di accesso.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMethod('phone')
              setStep('phone')
              setError(null)
            }}
            disabled={loading}
            className={`rounded-lg px-4 py-2 font-medium border ${
              method === 'phone'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Telefono
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('email')
              setError(null)
            }}
            disabled={loading}
            className={`rounded-lg px-4 py-2 font-medium border ${
              method === 'email'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Email
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {method === 'email' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoComplete="current-password"
              />
            </div>

            <button
              type="button"
              onClick={handleEmailLogin}
              disabled={loading || email.trim().length < 3 || password.length < 6}
              className="w-full bg-primary-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading ? 'Accesso…' : 'Accedi'}
            </button>
          </div>
        ) : step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero di telefono</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+39 333 123 4567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || phone.trim().length < 6}
              className="w-full bg-primary-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading ? 'Invio in corso…' : 'Invia codice'}
            </button>

            <div id={recaptchaContainerId} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice OTP</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={loading || code.trim().length < 4}
              className="w-full bg-primary-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              {loading ? 'Verifica…' : 'Verifica e accedi'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setConfirmation(null)
              }}
              disabled={loading}
              className="w-full text-gray-700 border border-gray-300 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              Cambia numero
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
