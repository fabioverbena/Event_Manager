import ProdottoAutocomplete from './ProdottoAutocomplete'
import ClienteAutocomplete from './ClienteAutocomplete'
import { getEventoCorrente } from '@/lib/eventoCorrente'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ERROR_MESSAGES, LIMITS } from '@/lib/constants'
import type { Database } from '@/types/database.types'
type Ordine = Database['public']['Tables']['ordini']['Row']
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
type RigaOrdine = Database['public']['Tables']['righe_ordine']['Row']
type RigaOrdineInsert = Database['public']['Tables']['righe_ordine']['Insert']
type RigaOrdineCreate = Omit<RigaOrdineInsert, 'ordine_id'>
type Cliente = Database['public']['Tables']['clienti']['Row']
type Prodotto = Database['public']['Tables']['prodotti']['Row']

type ProdottoConCategoria = Prodotto & {
  categorie?: {
    nome: string
    tipo_ordine: 'espositori' | 'non_espositori'
  } | null
}

type OrdineCompleto = Ordine & {
  righe_ordine?: Array<RigaOrdine & {
    prodotti?: Prodotto
  }>
}

type RigaOrdineCompleta = NonNullable<OrdineCompleto['righe_ordine']>[number]

interface RigaCarrello {
  prodotto_id: string
  prodotto?: Prodotto
  quantita: number
  prezzo_unitario: number
  note_riga: string
}

interface OrdineFormProps {
  ordine?: OrdineCompleto | null
  clienti: Cliente[]
  prodotti: ProdottoConCategoria[]
  onClose: () => void
  onSave: (ordine: OrdineInsert, righe: RigaOrdineCreate[]) => Promise<void>
}

export default function OrdineForm({ ordine, clienti, prodotti, onClose, onSave }: OrdineFormProps) {
  const [formData, setFormData] = useState<OrdineInsert>({
    cliente_id: '',
    nome_evento: getEventoCorrente() || '',
    data_ordine: new Date().toISOString().split('T')[0],
    stato: 'bozza',
    subtotale: 0,
    sconto_percentuale: null,
    sconto_valore: null,
    totale: 0,
    note: '',
    ha_espositori: false,
    ha_altri_prodotti: false,
  })

  const [tipoVenditaEspositori, setTipoVenditaEspositori] = useState<'diretto' | 'leasing'>('diretto')
  const [carrello, setCarrello] = useState<RigaCarrello[]>([])
  const [prodottoSelezionato, setProdottoSelezionato] = useState('')
  const [quantita, setQuantita] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Calcola se ci sono espositori nel carrello
  const hasEspositori = carrello.some(riga => {
    const prod = prodotti.find(p => p.id === riga.prodotto_id)
    return prod?.categorie?.tipo_ordine === 'espositori'
  })

  // Calcola subtotale
  const subtotale = carrello.reduce((sum, riga) => sum + (riga.quantita * riga.prezzo_unitario), 0)

  // Calcola sconto
  const scontoPercentuale = formData.sconto_percentuale || 0
  const scontoValore = formData.sconto_percentuale !== null && formData.sconto_percentuale !== undefined
    ? (subtotale * scontoPercentuale) / 100
    : (formData.sconto_valore || 0)
  // Calcola totale
  const totale = subtotale - scontoValore

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotale,
      // Se sconto_percentuale è impostato, metti sconto_valore a NULL
      // Altrimenti passa sconto_valore e metti sconto_percentuale a NULL
      sconto_percentuale: prev.sconto_percentuale !== null && prev.sconto_percentuale !== undefined && prev.sconto_percentuale > 0
        ? prev.sconto_percentuale
        : null,
      sconto_valore: scontoValore,
      totale
    }))
  }, [subtotale, scontoValore, totale])

  // Carica dati ordine in modifica
  useEffect(() => {
    if (ordine) {
      setFormData({
        cliente_id: ordine.cliente_id,
        nome_evento: ordine.nome_evento || '',
        data_ordine: ordine.data_ordine,
        stato: ordine.stato,
        subtotale: ordine.subtotale,
        sconto_percentuale: ordine.sconto_percentuale,
        sconto_valore: ordine.sconto_valore,
        totale: ordine.totale,
        note: ordine.note || '',
        ha_espositori: ordine.ha_espositori,
        ha_altri_prodotti: ordine.ha_altri_prodotti,
      })

      // Carica righe nel carrello
      if (ordine.righe_ordine && ordine.righe_ordine.length > 0) {
        const righeCarrello: RigaCarrello[] = ordine.righe_ordine.map((riga: RigaOrdineCompleta) => ({
          prodotto_id: riga.prodotto_id,
          prodotto: riga.prodotti,
          quantita: riga.quantita,
          prezzo_unitario: riga.prezzo_unitario,
          note_riga: riga.note_riga || '',
        }))
        setCarrello(righeCarrello)
      }

      // Carica tipo vendita espositori
      if (ordine.tipo_vendita_espositori) {
        setTipoVenditaEspositori(ordine.tipo_vendita_espositori as 'diretto' | 'leasing')
      }
    }
  }, [ordine])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'sconto_percentuale') {
      const numValue = parseFloat(value) || 0
      setFormData(prev => ({ ...prev, [name]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAggiungiProdotto = () => {
    if (!prodottoSelezionato) {
      setErrors(prev => ({ ...prev, prodotto: 'Seleziona un prodotto' }))
      return
    }

    if (quantita <= 0 || quantita > LIMITS.MAX_QUANTITA) {
      setErrors(prev => ({ ...prev, quantita: 'Quantità non valida' }))
      return
    }

    const prodotto = prodotti.find(p => p.id === prodottoSelezionato)
    if (!prodotto) return

    // Controlla se prodotto già nel carrello
    const esistente = carrello.find(r => r.prodotto_id === prodottoSelezionato)

    if (esistente) {
      // Aggiorna quantità
      setCarrello(prev =>
        prev.map(r =>
          r.prodotto_id === prodottoSelezionato
            ? { ...r, quantita: r.quantita + quantita }
            : r
        )
      )
    } else {
      // Aggiungi nuova riga
      setCarrello(prev => [
        ...prev,
        {
          prodotto_id: prodottoSelezionato,
          prodotto,
          quantita,
          prezzo_unitario: prodotto.prezzo_listino,
          note_riga: '',
        },
      ])
    }

    // Reset selezione
    setProdottoSelezionato('')
    setQuantita(1)
    setErrors(prev => ({ ...prev, prodotto: '', quantita: '' }))
  }

  const handleRimuoviProdotto = (prodotto_id: string) => {
    setCarrello(prev => prev.filter(r => r.prodotto_id !== prodotto_id))
  }

  const handleUpdateQuantita = (prodotto_id: string, nuovaQuantita: number) => {
    if (nuovaQuantita <= 0) {
      handleRimuoviProdotto(prodotto_id)
    } else {
      setCarrello(prev =>
        prev.map(r =>
          r.prodotto_id === prodotto_id
            ? { ...r, quantita: nuovaQuantita }
            : r
        )
      )
    }
  }

  const handleUpdatePrezzo = (prodotto_id: string, nuovoPrezzo: number) => {
    setCarrello(prev =>
      prev.map(r =>
        r.prodotto_id === prodotto_id
          ? { ...r, prezzo_unitario: nuovoPrezzo }
          : r
      )
    )
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.cliente_id) {
      newErrors.cliente_id = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (!formData.nome_evento?.trim()) {
      newErrors.nome_evento = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (carrello.length === 0) {
      newErrors.carrello = 'Aggiungi almeno un prodotto'
    }

    if (formData.sconto_percentuale !== null && formData.sconto_percentuale !== undefined) {
      if (formData.sconto_percentuale < LIMITS.MIN_SCONTO_PERCENTUALE ||
        formData.sconto_percentuale > LIMITS.MAX_SCONTO_PERCENTUALE) {
        newErrors.sconto_percentuale = `Lo sconto deve essere tra ${LIMITS.MIN_SCONTO_PERCENTUALE}% e ${LIMITS.MAX_SCONTO_PERCENTUALE}%`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      const righe: RigaOrdineCreate[] = carrello.map((riga, index) => ({
        prodotto_id: riga.prodotto_id,
        quantita: riga.quantita,
        prezzo_unitario: riga.prezzo_unitario,
        subtotale_riga: riga.quantita * riga.prezzo_unitario,
        note_riga: riga.note_riga || null,
        ordine_riga: index + 1,
      }))

      // Se c'è sconto_percentuale, azzera sconto_valore nel DB (sarà ricalcolato)
      // Se c'è solo sconto_valore, azzera sconto_percentuale
      const hasScontoPercentuale = formData.sconto_percentuale != null && formData.sconto_percentuale > 0

      const ordineCompleto: OrdineInsert = {
        ...formData,
        sconto_percentuale: hasScontoPercentuale ? formData.sconto_percentuale : null,
        sconto_valore: formData.sconto_valore || 0,
        tipo_vendita_espositori: hasEspositori ? tipoVenditaEspositori : null,
      }
  
      await onSave(ordineCompleto, righe)
      onClose()
    } catch (error) {
      console.error('Errore salvataggio:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {ordine ? 'Modifica Ordine' : 'Nuovo Ordine'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente, Evento e Data */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div>
    <label className="label">
      Cliente <span className="text-red-500">*</span>
    </label>
    <div className={errors.cliente_id ? 'rounded-md ring-1 ring-red-500' : ''}>
      <ClienteAutocomplete
        clienti={clienti ?? []}
        selectedClienteId={formData.cliente_id ?? ''}
        onSelect={(cliente) => {
          setFormData(prev => ({ ...prev, cliente_id: cliente.id }))
          if (errors.cliente_id) {
            setErrors(prev => ({ ...prev, cliente_id: '' }))
          }
        }}
        onClear={() => {
          setFormData(prev => ({ ...prev, cliente_id: '' }))
        }}
        placeholder="Cerca cliente per ragione sociale..."
      />
    </div>
    {errors.cliente_id && (
      <p className="text-red-500 text-sm mt-1">{errors.cliente_id}</p>
    )}
  </div>

            <div>
    <label className="label">
      Nome Evento <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      name="nome_evento"
      value={formData.nome_evento ?? ''}
      onChange={handleChange}
      className={`input ${errors.nome_evento ? 'border-red-500' : ''}`}
      placeholder="es: IPM Essen 2026"
    />
    {errors.nome_evento && (
      <p className="text-red-500 text-sm mt-1">{errors.nome_evento}</p>
    )}
  </div>

  <div>
    <label className="label">Data Ordine</label>
    <input
      type="date"
      name="data_ordine"
      value={formData.data_ordine ?? ''}
      onChange={handleChange}
      className="input"
    />
  </div>
</div>

          {/* Aggiunta Prodotti */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Prodotti
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="md:col-span-2">
  <label className="label">Seleziona Prodotto</label>
  <ProdottoAutocomplete
    prodotti={prodotti}
    onSelect={(prodotto) => {
      setProdottoSelezionato(prodotto.id)
    }}
    placeholder="Cerca prodotto per nome o codice..."
  />
  {errors.prodotto && (
    <p className="text-red-500 text-sm mt-1">{errors.prodotto}</p>
  )}
</div>

              <div>
                <label className="label">Quantità</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={quantita}
                    onChange={(e) => setQuantita(parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    className={`input ${errors.quantita ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={handleAggiungiProdotto}
                    className="btn-primary whitespace-nowrap"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {errors.prodotto && (
              <p className="text-red-500 text-sm mb-2">{errors.prodotto}</p>
            )}
            {errors.carrello && (
              <p className="text-red-500 text-sm mb-2">{errors.carrello}</p>
            )}

            {/* Carrello */}
            {carrello.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Prodotto</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Q.tà</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Prezzo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Subtotale</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {carrello.map((riga) => (
                      <tr key={riga.prodotto_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm">{riga.prodotto?.nome}</div>
                          <div className="text-xs text-gray-500">{riga.prodotto?.codice_prodotto}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={riga.quantita}
                            onChange={(e) => handleUpdateQuantita(riga.prodotto_id, parseFloat(e.target.value) || 0)}
                            className="input text-center w-20"
                            step="0.01"
                            min="0.01"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={riga.prezzo_unitario}
                            onChange={(e) => handleUpdatePrezzo(riga.prodotto_id, parseFloat(e.target.value) || 0)}
                            className="input text-right w-28"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(riga.quantita * riga.prezzo_unitario)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRimuoviProdotto(riga.prodotto_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tipo Vendita Espositori */}
          {hasEspositori && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Tipo Vendita Espositori
              </h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="diretto"
                    checked={tipoVenditaEspositori === 'diretto'}
                    onChange={(e) => setTipoVenditaEspositori(e.target.value as 'diretto')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Vendita Diretta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="leasing"
                    checked={tipoVenditaEspositori === 'leasing'}
                    onChange={(e) => setTipoVenditaEspositori(e.target.value as 'leasing')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Leasing (Grenke)</span>
                </label>
              </div>
            </div>
          )}

          {/* Sconto e Totali */}
<div className="card bg-gray-50">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="label">Tipo Sconto</label>
      <select
        value={formData.sconto_percentuale !== null && formData.sconto_percentuale !== undefined ? 'percentuale' : 'valore'}
        onChange={(e) => {
          if (e.target.value === 'percentuale') {
            setFormData(prev => ({ ...prev, sconto_percentuale: 0 }))
          } else {
            setFormData(prev => ({ ...prev, sconto_percentuale: null }))
          }
        }}
        className="input"
      >
        <option value="percentuale">Percentuale (%)</option>
        <option value="valore">Valore (€)</option>
      </select>
    </div>

    {formData.sconto_percentuale !== null && formData.sconto_percentuale !== undefined ? (
      <div>
        <label className="label">Sconto %</label>
        <input
          type="number"
          name="sconto_percentuale"
          value={formData.sconto_percentuale || ''}
          onChange={handleChange}
          className={`input ${errors.sconto_percentuale ? 'border-red-500' : ''}`}
          placeholder="0"
          min={LIMITS.MIN_SCONTO_PERCENTUALE}
          max={LIMITS.MAX_SCONTO_PERCENTUALE}
          step="0.01"
        />
        {errors.sconto_percentuale && (
          <p className="text-red-500 text-sm mt-1">{errors.sconto_percentuale}</p>
        )}
      </div>
    ) : (
      <div>
        <label className="label">Sconto €</label>
        <input
          type="number"
          value={(formData.sconto_valore || 0)}
          onChange={(e) => {
            const val = parseFloat(e.target.value) || 0
            setFormData(prev => ({ 
              ...prev, 
              sconto_valore: val,
              sconto_percentuale: null 
            }))
          }}
          className="input"
          placeholder="0.00"
          min="0"
          max={subtotale}
          step="0.01"
        />
      </div>
    )}

              <div className="space-y-2 text-right">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotale:</span>
                  <span className="font-semibold">{formatCurrency(subtotale)}</span>
                </div>
                {scontoValore > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Sconto ({scontoPercentuale}%):</span>
                    <span>- {formatCurrency(scontoValore)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Totale:</span>
                  <span className="text-primary-600">{formatCurrency(totale)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note Ordine</label>
            <textarea
              name="note"
              value={formData.note ?? ''}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Note aggiuntive per l'ordine..."
            />
          </div>

          {/* Bottoni */}
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
              disabled={saving || carrello.length === 0}
            >
              {saving ? 'Salvataggio...' : ordine ? 'Salva Modifiche' : 'Crea Ordine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}