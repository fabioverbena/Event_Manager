import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { UNITA_MISURA, ERROR_MESSAGES, LIMITS } from '@/lib/constants'
import type { Database } from '@/types/database.types'

type Prodotto = Database['public']['Tables']['prodotti']['Row']
type ProdottoInsert = Database['public']['Tables']['prodotti']['Insert']
type Categoria = Database['public']['Tables']['categorie']['Row']

interface ProdottoFormProps {
  prodotto?: Prodotto | null
  categorie: Categoria[]
  onClose: () => void
  onSave: (data: ProdottoInsert) => Promise<void>
  onGenerateCodice: (nome: string) => Promise<string>
}

export default function ProdottoForm({ prodotto, categorie, onClose, onSave, onGenerateCodice }: ProdottoFormProps) {
  const [formData, setFormData] = useState<ProdottoInsert>({
    categoria_id: '',
    codice_prodotto: '',
    nome: '',
    descrizione: '',
    prezzo_listino: 0,
    unita_misura: 'pz',
    disponibile: true,
    note: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    if (prodotto) {
      setFormData({
        categoria_id: prodotto.categoria_id,
        codice_prodotto: prodotto.codice_prodotto,
        nome: prodotto.nome,
        descrizione: prodotto.descrizione || '',
        prezzo_listino: prodotto.prezzo_listino,
        unita_misura: prodotto.unita_misura || 'pz',
        disponibile: prodotto.disponibile,
        note: prodotto.note || '',
      })
    }
  }, [prodotto])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'prezzo_listino') {
      const numValue = parseFloat(value) || 0
      setFormData(prev => ({ ...prev, [name]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleGenerateCodice = async () => {
    if (!formData.nome.trim()) {
      setErrors(prev => ({ ...prev, nome: 'Inserisci prima il nome del prodotto' }))
      return
    }

    setGeneratingCode(true)
    try {
      const codice = await onGenerateCodice(formData.nome)
      setFormData(prev => ({ ...prev, codice_prodotto: codice }))
      setErrors(prev => ({ ...prev, codice_prodotto: '' }))
    } catch (error) {
      console.error('Errore generazione codice:', error)
    } finally {
      setGeneratingCode(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome?.trim()) {
      newErrors.nome = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (!formData.codice_prodotto?.trim()) {
      newErrors.codice_prodotto = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (formData.prezzo_listino < LIMITS.MIN_PREZZO) {
      newErrors.prezzo_listino = `Il prezzo deve essere almeno ${LIMITS.MIN_PREZZO}`
    }

    if (formData.prezzo_listino > LIMITS.MAX_PREZZO) {
      newErrors.prezzo_listino = `Il prezzo non può superare ${LIMITS.MAX_PREZZO}`
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

  const categorieParent = categorie.filter(c => !c.parent_id)
  const categorieChild = (parentId: string) => categorie.filter(c => c.parent_id === parentId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {prodotto ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
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
              Nome Prodotto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`input ${errors.nome ? 'border-red-500' : ''}`}
              placeholder="Es: Espositore Refrigerato Medio"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Codice Prodotto <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="codice_prodotto"
                  value={formData.codice_prodotto}
                  onChange={handleChange}
                  className={`input ${errors.codice_prodotto ? 'border-red-500' : ''}`}
                  placeholder="ESRE-001"
                  readOnly={!prodotto}
                />
                {!prodotto && (
                  <button
                    type="button"
                    onClick={handleGenerateCodice}
                    disabled={generatingCode || !formData.nome.trim()}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {generatingCode ? 'Generando...' : 'Genera'}
                  </button>
                )}
              </div>
              {errors.codice_prodotto && (
                <p className="text-red-500 text-sm mt-1">{errors.codice_prodotto}</p>
              )}
            </div>

            <div>
              <label className="label">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleChange}
                className={`input ${errors.categoria_id ? 'border-red-500' : ''}`}
              >
                <option value="">Seleziona categoria...</option>
                {categorieParent.map(parent => (
                  <optgroup key={parent.id} label={parent.nome}>
                    {categorieChild(parent.id).map(child => (
                      <option key={child.id} value={child.id}>
                        {child.nome}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.categoria_id && (
                <p className="text-red-500 text-sm mt-1">{errors.categoria_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Prezzo Listino (imponibile) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="prezzo_listino"
                value={formData.prezzo_listino}
                onChange={handleChange}
                step="0.01"
                min={LIMITS.MIN_PREZZO}
                max={LIMITS.MAX_PREZZO}
                className={`input ${errors.prezzo_listino ? 'border-red-500' : ''}`}
                placeholder="1500.00"
              />
              {errors.prezzo_listino && (
                <p className="text-red-500 text-sm mt-1">{errors.prezzo_listino}</p>
              )}
            </div>

            <div>
              <label className="label">Unità di Misura</label>
              <select
                name="unita_misura"
                value={formData.unita_misura}
                onChange={handleChange}
                className="input"
              >
                {UNITA_MISURA.map(um => (
                  <option key={um.value} value={um.value}>
                    {um.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descrizione</label>
            <textarea
              name="descrizione"
              value={formData.descrizione || ''}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Descrizione dettagliata del prodotto..."
            />
          </div>

          <div>
            <label className="label">Note interne</label>
            <textarea
              name="note"
              value={formData.note || ''}
              onChange={handleChange}
              className="input"
              rows={2}
              placeholder="Note visibili solo internamente..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="disponibile"
              checked={formData.disponibile}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Prodotto disponibile per gli ordini
            </label>
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
              {saving ? 'Salvataggio...' : prodotto ? 'Salva Modifiche' : 'Crea Prodotto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}