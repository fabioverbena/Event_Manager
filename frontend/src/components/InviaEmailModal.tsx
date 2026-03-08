import { useMemo, useState } from 'react'
import { X, Send } from 'lucide-react'
import type { Database } from '@/types/database.types'
import { firebaseAuth } from '@/lib/firebase'
import { generatePreventivoPDFBlob } from '@/lib/pdfGenerator'

type Ordine = Database['public']['Tables']['ordini']['Row'] & {
  clienti?: {
    ragione_sociale: string
    email: string | null
  } | null
  righe_ordine?: (Database['public']['Tables']['righe_ordine']['Row'] & {
    prodotti?: {
      nome: string
      codice_prodotto: string
      unita_misura: string | null
    } | null
  })[]
}

interface InviaEmailModalProps {
  ordine: Ordine
  onClose: () => void
}

const blobToBase64 = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export default function InviaEmailModal({ ordine, onClose }: InviaEmailModalProps) {
  const [to, setTo] = useState(ordine.clienti?.email || '')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const ordineLabel = useMemo(() => {
    const numero = ordine.numero_ordine.toString().padStart(4, '0')
    const cliente = ordine.clienti?.ragione_sociale ? ` - ${ordine.clienti.ragione_sociale}` : ''
    return `#${numero}${cliente}`
  }, [ordine.clienti?.ragione_sociale, ordine.numero_ordine])

  useMemo(() => {
    if (!subject) {
      const numero = ordine.numero_ordine.toString().padStart(4, '0')
      const cliente = ordine.clienti?.ragione_sociale || 'Cliente'
      setSubject(`Preventivo #${numero} - ${cliente}`)
    }
    if (!text) {
      const cliente = ordine.clienti?.ragione_sociale || ''
      setText(
        `Buongiorno ${cliente ? cliente + ',' : ''}\n\nIn allegato trova il preventivo richiesto.\n\nResto a disposizione per qualsiasi chiarimento.\n\nCordiali saluti\nFior d'Acqua`
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = async () => {
    try {
      setSending(true)
      setError(null)
      setSuccess(null)

      if (!to.trim()) {
        setError('Inserisci un destinatario (A)')
        return
      }
      if (!subject.trim()) {
        setError('Inserisci un oggetto')
        return
      }
      if (!text.trim()) {
        setError('Inserisci un testo email')
        return
      }

      const user = firebaseAuth.currentUser
      if (!user) {
        setError('Utente non autenticato')
        return
      }

      const idToken = await user.getIdToken()

      const { blob, filename } = await generatePreventivoPDFBlob(ordine as any)
      const attachmentBase64 = await blobToBase64(blob)

      const resp = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          to,
          subject,
          text,
          attachmentBase64,
          attachmentFilename: filename,
        }),
      })

      const data = await resp.json().catch(() => null)
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${resp.status}`)
      }

      setSuccess('Email inviata')
      setTimeout(() => onClose(), 800)
    } catch (e: any) {
      setError(e?.message || 'Errore invio email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invia Email Preventivo</h2>
            <div className="text-sm text-gray-600 mt-1">Ordine {ordineLabel}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={sending}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div>
            <label className="label">A</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input"
              placeholder="cliente@dominio.it"
              disabled={sending}
            />
          </div>

          <div>
            <label className="label">Oggetto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              disabled={sending}
            />
          </div>

          <div>
            <label className="label">Testo</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input min-h-[180px]"
              disabled={sending}
            />
          </div>

          <div className="text-xs text-gray-500">
            Allegato: Preventivo PDF (generato automaticamente)
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t">
          <button onClick={onClose} className="btn-secondary" disabled={sending}>
            Annulla
          </button>
          <button onClick={handleSend} className="btn-primary flex items-center gap-2" disabled={sending}>
            <Send size={20} />
            {sending ? 'Invio...' : 'Invia'}
          </button>
        </div>
      </div>
    </div>
  )
}
