import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { validatePartitaIVA, validateCodiceFiscale } from '@/lib/utils'
import { PROVINCE_ITALIANE, ERROR_MESSAGES } from '@/lib/constants'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']
type ClienteInsert = Database['public']['Tables']['clienti']['Insert']

interface ClienteFormProps {
  cliente?: Cliente | null
  onClose: () => void
  onSave: (data: ClienteInsert) => Promise<void>
}

export default function ClienteForm({ cliente, onClose, onSave }: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteInsert>({
    ragione_sociale: '',
    nome_referente: '',
    email: '',
    telefono: '',
    cellulare: '',
    partita_iva: '',
    codice_fiscale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    note: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cliente) {
      setFormData({
        ragione_sociale: cliente.ragione_sociale,
        nome_referente: cliente.nome_referente || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        cellulare: cliente.cellulare || '',
        partita_iva: cliente.partita_iva || '',
        codice_fiscale: cliente.codice_fiscale || '',
        indirizzo: cliente.indirizzo || '',
        citta: cliente.citta || '',
        cap: cliente.cap || '',
        provincia: cliente.provincia || '',
        note: cliente.note || '',
      })
    }
  }, [cliente])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.ragione_sociale?.trim()) {
      newErrors.ragione_sociale = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ERROR_MESSAGES.INVALID_EMAIL
    }

    if (formData.partita_iva && !validatePartitaIVA(formData.partita_iva)) {
      newErrors.partita_iva = ERROR_MESSAGES.INVALID_PARTITA_IVA
    }

    if (formData.codice_fiscale && !validateCodiceFiscale(formData.codice_fiscale)) {
      newErrors.codice_fiscale = ERROR_MESSAGES.INVALID_CODICE_FISCALE
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Errore salvataggio:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="label">
              Ragione Sociale <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ragione_sociale"
              value={formData.ragione_sociale}
              onChange={handleChange}
              className={`input ${errors.ragione_sociale ? 'border-red-500' : ''}`}
              placeholder="Es: Fioreria Rossi Srl"
            />
            {errors.ragione_sociale && (
              <p className="text-red-500 text-sm mt-1">{errors.ragione_sociale}</p>
            )}
          </div>

          <div>
            <label className="label">Nome Referente</label>
            <input
              type="text"
              name="nome_referente"
              value={formData.nome_referente}
              onChange={handleChange}
              className="input"
              placeholder="Es: Mario Rossi"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="info@esempio.it"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="label">Telefono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input"
                placeholder="06 1234567"
              />
            </div>

            <div>
              <label className="label">Cellulare</label>
              <input
                type="tel"
                name="cellulare"
                value={formData.cellulare}
                onChange={handleChange}
                className="input"
                placeholder="333 1234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Partita IVA</label>
              <input
                type="text"
                name="partita_iva"
                value={formData.partita_iva}
                onChange={handleChange}
                className={`input ${errors.partita_iva ? 'border-red-500' : ''}`}
                placeholder="12345678901"
                maxLength={11}
              />
              {errors.partita_iva && (
                <p className="text-red-500 text-sm mt-1">{errors.partita_iva}</p>
              )}
            </div>

            <div>
              <label className="label">Codice Fiscale</label>
              <input
                type="text"
                name="codice_fiscale"
                value={formData.codice_fiscale}
                onChange={handleChange}
                className={`input ${errors.codice_fiscale ? 'border-red-500' : ''}`}
                placeholder="RSSMRA80A01H501U"
                maxLength={16}
              />
              {errors.codice_fiscale && (
                <p className="text-red-500 text-sm mt-1">{errors.codice_fiscale}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label">Indirizzo</label>
            <input
              type="text"
              name="indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
              className="input"
              placeholder="Via Roma 123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Città</label>
              <input
                type="text"
                name="citta"
                value={formData.citta}
                onChange={handleChange}
                className="input"
                placeholder="Roma"
              />
            </div>

            <div>
              <label className="label">CAP</label>
              <input
                type="text"
                name="cap"
                value={formData.cap}
                onChange={handleChange}
                className="input"
                placeholder="00100"
                maxLength={5}
              />
            </div>

            <div>
              <label className="label">Provincia</label>
              <select
                name="provincia"
                value={formData.provincia}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleziona...</option>
                {PROVINCE_ITALIANE.map(prov => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Note interne..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Salvataggio...' : cliente ? 'Salva Modifiche' : 'Crea Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}