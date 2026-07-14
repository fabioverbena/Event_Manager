import ClienteSearchModal from './ClienteSearchModal'
import ProdottoSearchModal from './ProdottoSearchModal'
import { getEventoCorrente } from '@/lib/eventoCorrente'
import { useState, useEffect, useRef } from 'react'
import { X, Trash2, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ERROR_MESSAGES, LIMITS } from '@/lib/constants'
import type { OrdineCompleto } from '@/hooks/useOrdini'
import { useNavigate } from 'react-router-dom'
import type { Database } from '@/types/database.types'
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
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

type RigaOrdineCompleta = NonNullable<OrdineCompleto['righe_ordine']>[number]

interface RigaCarrello {
  prodotto_id: string
  prodotto?: Prodotto
  codice_input?: string
  quantita: number
  prezzo_unitario: number
  sconto: number
  note_riga: string
}

interface OrdineFormProps {
  ordine?: OrdineCompleto | null
  clienti: Cliente[]
  prodotti: ProdottoConCategoria[]
  initialClienteId?: string
  onClose: () => void
  onSave: (ordine: OrdineInsert, righe: RigaOrdineCreate[]) => Promise<void>
}

export default function OrdineForm({ ordine, clienti, prodotti, initialClienteId, onClose, onSave }: OrdineFormProps) {
  const navigate = useNavigate()

  const parseLocaleNumber = (raw: string) => {
    const normalized = (raw || '').replace(',', '.')
    const n = parseFloat(normalized)
    return Number.isFinite(n) ? n : 0
  }

  const [prodottoSearchOpen, setProdottoSearchOpen] = useState(false)
  const [prodottoSearchQuery, setProdottoSearchQuery] = useState('')
  const [prodottoSearchRowIndex, setProdottoSearchRowIndex] = useState<number | null>(null)
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])
  const codiceRefs = useRef<Array<HTMLInputElement | null>>([])
  const prezzoRefs = useRef<Array<HTMLInputElement | null>>([])

  const [clienteSearchOpen, setClienteSearchOpen] = useState(false)
  const [clienteSearchQuery, setClienteSearchQuery] = useState('')
  const [clienteSearchMode, setClienteSearchMode] = useState<'list' | 'confirm' | 'create'>('list')
  const [clienteMatches, setClienteMatches] = useState<Cliente[]>([])
  const [clienteInput, setClienteInput] = useState('')

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
    operatore: null,
    ha_espositori: false,
    ha_altri_prodotti: false,
  })

  const [tipoVenditaEspositori, setTipoVenditaEspositori] = useState<'diretto' | 'leasing_standard' | 'leasing_personalizzato'>('diretto')
  const [carrello, setCarrello] = useState<RigaCarrello[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const isScontoExtra = (riga: RigaCarrello) =>
    (riga.prodotto?.nome || '').toLowerCase().includes('sconto extra')

  // Calcola se ci sono espositori nel carrello
  const hasEspositori = carrello.some(riga => {
    const prod = prodotti.find(p => p.id === riga.prodotto_id)
    return prod?.categorie?.tipo_ordine === 'espositori'
  })

  const computeRiga = (riga: RigaCarrello) => {
    const gross = (riga.quantita || 0) * (riga.prezzo_unitario || 0)
    if (isScontoExtra(riga)) {
      return { gross, scontoImporto: 0, net: gross }
    }
    const s = Number(riga.sconto || 0)
    const scontoImporto = s > 0
      ? (gross * s) / 100
      : s < 0
        ? Math.min(gross, Math.abs(s))
        : 0
    const net = gross - scontoImporto

    return {
      gross,
      scontoImporto,
      net,
    }
  }

  const subtotale = carrello.reduce((acc, riga) => acc + computeRiga(riga).net, 0)
  const totale = subtotale

  // Default sconto 5% per leasing (Grenke) sugli espositori, senza sovrascrivere se già impostato
  useEffect(() => {
    if (!hasEspositori) return
    if (!tipoVenditaEspositori.startsWith('leasing')) return

    setCarrello(prev =>
      prev.map(r => {
        const prod = prodotti.find(p => p.id === r.prodotto_id)
        const isExpo = prod?.categorie?.tipo_ordine === 'espositori'
        if (!isExpo) return r
        const hasManual = r.sconto != null && Number(r.sconto) !== 0
        if (hasManual) return r
        return { ...r, sconto: 5 }
      })
    )
  }, [hasEspositori, tipoVenditaEspositori])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotale,
      totale
    }))
  }, [subtotale, totale])

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
        operatore: ordine.operatore || null,
        ha_espositori: ordine.ha_espositori,
        ha_altri_prodotti: ordine.ha_altri_prodotti,
      })

      // Carica righe nel carrello
      if (ordine.righe_ordine && ordine.righe_ordine.length > 0) {
        const righeCarrello: RigaCarrello[] = ordine.righe_ordine.map((riga: RigaOrdineCompleta) => ({
          prodotto_id: riga.prodotto_id,
          prodotto: riga.prodotti,
          codice_input: '',
          quantita: riga.quantita,
          prezzo_unitario: riga.prezzo_unitario,
          sconto: (() => {
            const gross = (Number(riga.quantita) || 0) * (Number(riga.prezzo_unitario) || 0)
            const net = Number(riga.subtotale_riga) || gross
            if (gross <= 0) return 0
            if (net >= gross) return 0
            const perc = ((gross - net) / gross) * 100
            return Math.round(perc * 100) / 100
          })(),
          note_riga: riga.note_riga || '',
        }))
        const maxRows = 5
        const padded: RigaCarrello[] = [...righeCarrello]
        while (padded.length < maxRows) {
          padded.push({ prodotto_id: '', prodotto: undefined, codice_input: '', quantita: 1, prezzo_unitario: 0, sconto: 0, note_riga: '' })
        }
        setCarrello(padded.slice(0, maxRows))
      }

      // Carica tipo vendita espositori
      if (ordine.tipo_vendita_espositori) {
        const tvn = ordine.tipo_vendita_espositori
        if (tvn === 'leasing') {
          setTipoVenditaEspositori('leasing_standard')
        } else {
          setTipoVenditaEspositori(tvn as 'diretto' | 'leasing_standard' | 'leasing_personalizzato')
        }
      }

      const selected = (clienti || []).find(c => c.id === ordine.cliente_id)
      setClienteInput(selected?.ragione_sociale || '')
    }
  }, [ordine, clienti])

  useEffect(() => {
    if (!formData.cliente_id) return
    const selected = (clienti || []).find(c => c.id === formData.cliente_id)
    if (selected && selected.ragione_sociale !== clienteInput) {
      setClienteInput(selected.ragione_sociale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cliente_id, clienti])

  useEffect(() => {
    if (ordine) return
    if (!initialClienteId) return
    if (formData.cliente_id) return
    const selected = (clienti || []).find(c => c.id === initialClienteId)
    if (!selected) return
    setFormData(prev => ({ ...prev, cliente_id: selected.id }))
    setClienteInput(selected.ragione_sociale || '')
    focusCodiceRow(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordine, initialClienteId, clienti])

  useEffect(() => {
    if (ordine) return
    setCarrello(prev => {
      if (prev.length > 0) return prev
      const maxRows = 5
      const base: RigaCarrello[] = []
      while (base.length < maxRows) {
        base.push({ prodotto_id: '', prodotto: undefined, codice_input: '', quantita: 1, prezzo_unitario: 0, sconto: 0, note_riga: '' })
      }
      return base
    })
  }, [ordine])

  useEffect(() => {
    if (!clienteSearchOpen) return
    const q = clienteSearchQuery.trim().toLowerCase()
    const list = q
      ? (clienti || []).filter(c => (c.ragione_sociale || '').toLowerCase().includes(q))
      : (clienti || [])

    setClienteMatches(list)

    if (q.length === 0) {
      setClienteSearchMode('list')
    } else if (list.length === 0) {
      setClienteSearchMode('create')
    } else if (list.length === 1) {
      setClienteSearchMode('confirm')
    } else {
      setClienteSearchMode('list')
    }
  }, [clienteSearchOpen, clienteSearchQuery, clienti])

  const ensureCarrelloRows = (righe?: RigaCarrello[]) => {
    const maxRows = 5
    const base = righe ? [...righe] : [...carrello]
    while (base.length < maxRows) {
      base.push({ prodotto_id: '', prodotto: undefined, codice_input: '', quantita: 1, prezzo_unitario: 0, sconto: 0, note_riga: '' })
    }
    return base.slice(0, maxRows)
  }

  const openClienteSearchForQuery = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setClienteSearchQuery(query)
    setClienteSearchOpen(true)
  }

  const closeClienteSearch = () => {
    setClienteSearchOpen(false)
    setClienteSearchQuery('')
    setClienteMatches([])
    setClienteSearchMode('list')
  }

  const handleUpdateRiga = (index: number, patch: Partial<RigaCarrello>) => {
    setCarrello(prev => {
      const next = ensureCarrelloRows(prev)
      const current = next[index]
      next[index] = { ...current, ...patch }
      return next
    })
  }

  const handleResetRiga = (index: number) => {
    handleUpdateRiga(index, { prodotto_id: '', prodotto: undefined, codice_input: '', quantita: 1, prezzo_unitario: 0, sconto: 0, note_riga: '' })
  }

  const handleClearRiga = (index: number) => {
    setCarrello(prev => ensureCarrelloRows(prev.filter((_, i) => i !== index)))
  }

  const openProdottoSearch = (rowIndex: number, initialQuery: string) => {
    setProdottoSearchRowIndex(rowIndex)
    setProdottoSearchQuery(initialQuery)
    setProdottoSearchOpen(true)
  }

  const closeProdottoSearch = () => {
    setProdottoSearchOpen(false)
    setProdottoSearchRowIndex(null)
    setProdottoSearchQuery('')
  }

  const focusPrezzoRow = (rowIndex: number) => {
    const rowEl = rowRefs.current[rowIndex]
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    window.setTimeout(() => {
      const input = prezzoRefs.current[rowIndex]
      input?.focus()
      input?.select()
    }, 0)
  }

  const focusCodiceRow = (rowIndex: number) => {
    const rowEl = rowRefs.current[rowIndex]
    if (rowEl) {
      rowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    window.setTimeout(() => {
      const input = codiceRefs.current[rowIndex]
      input?.focus()
      input?.select()
    }, 0)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.cliente_id) {
      newErrors.cliente_id = ERROR_MESSAGES.REQUIRED_FIELD
    }

    if (!formData.nome_evento?.trim()) {
      newErrors.nome_evento = ERROR_MESSAGES.REQUIRED_FIELD
    }

    const righeValide = carrello.filter(r => r.prodotto_id)
    if (righeValide.length === 0) {
      newErrors.carrello = 'Aggiungi almeno un prodotto'
    }

    carrello.forEach((riga, idx) => {
      if (!riga.prodotto_id) return
      if ((riga.quantita || 0) <= 0 || (riga.quantita || 0) > LIMITS.MAX_QUANTITA) {
        newErrors[`quantita_${idx}`] = 'Quantità non valida'
      }
      const s = Number(riga.sconto || 0)
      if (s > LIMITS.MAX_SCONTO_PERCENTUALE) {
        newErrors[`sconto_${idx}`] = `Sconto % max ${LIMITS.MAX_SCONTO_PERCENTUALE}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      const righeValide = carrello.filter(r => r.prodotto_id)

      const righe: RigaOrdineCreate[] = righeValide.map((riga, index) => ({
        prodotto_id: riga.prodotto_id,
        quantita: riga.quantita,
        prezzo_unitario: riga.prezzo_unitario,
        subtotale_riga: computeRiga(riga).net,
        note_riga: riga.note_riga || null,
        ordine_riga: index + 1,
      }))

      const ordineCompleto: OrdineInsert = {
        ...formData,
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
      <ClienteSearchModal
        open={clienteSearchOpen}
        query={clienteSearchQuery}
        setQuery={setClienteSearchQuery}
        mode={clienteSearchMode}
        matches={clienteMatches}
        onClose={closeClienteSearch}
        onSelect={(cliente) => {
          setFormData(prev => ({ ...prev, cliente_id: cliente.id }))
          setClienteInput(cliente.ragione_sociale)
          if (errors.cliente_id) {
            setErrors(prev => ({ ...prev, cliente_id: '' }))
          }
          closeClienteSearch()
        }}
        onCreateNew={(ragioneSociale) => {
          closeClienteSearch()
          navigate(`/clienti?new=1&ragione_sociale=${encodeURIComponent(ragioneSociale)}&return_to=ordini`)
        }}
      />

      <ProdottoSearchModal
        open={prodottoSearchOpen}
        query={prodottoSearchQuery}
        setQuery={setProdottoSearchQuery}
        prodotti={prodotti}
        onClose={closeProdottoSearch}
        onSelect={(p) => {
          if (prodottoSearchRowIndex == null) return
          const idx = prodottoSearchRowIndex
          handleUpdateRiga(prodottoSearchRowIndex, {
            prodotto_id: p.id,
            prodotto: p as unknown as Prodotto,
            codice_input: '',
            prezzo_unitario: p.prezzo_listino,
          })
          closeProdottoSearch()
          focusPrezzoRow(idx)
        }}
      />
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
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
                <div className="relative">
                  <input
                    type="text"
                    value={clienteInput}
                    onChange={(e) => {
                      const next = e.target.value
                      setClienteInput(next)
                      if (formData.cliente_id) {
                        setFormData(prev => ({ ...prev, cliente_id: '' }))
                      }

                      const trimmed = next.trim()
                      if (trimmed && !clienteSearchOpen) {
                        openClienteSearchForQuery(trimmed)
                      } else if (trimmed && clienteSearchOpen) {
                        setClienteSearchQuery(trimmed)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && clienteSearchOpen) {
                        e.preventDefault()
                        closeClienteSearch()
                      }
                    }}
                    className="input"
                    autoComplete="off"
                  />

                  {!!clienteInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setClienteInput('')
                        setFormData(prev => ({ ...prev, cliente_id: '' }))
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Pulisci"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
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
                onChange={(e) => {
                  const { name, value } = e.target
                  setFormData(prev => ({ ...prev, [name]: value }))
                  if (errors[name]) {
                    setErrors(prev => ({ ...prev, [name]: '' }))
                  }
                }}
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
                onChange={(e) => {
                  const { name, value } = e.target
                  setFormData(prev => ({ ...prev, [name]: value }))
                }}
                className="input"
              />
            </div>

            <div>
              <label className="label">Operatore</label>
              <input
                type="text"
                name="operatore"
                value={formData.operatore ?? ''}
                onChange={(e) => {
                  const { name, value } = e.target
                  setFormData(prev => ({ ...prev, [name]: value || null }))
                }}
                className="input"
                placeholder="Nome operatore..."
              />
            </div>
          </div>

          {/* Aggiunta Prodotti */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart size={20} />
              Prodotti
            </h3>

            {errors.carrello && (
              <p className="text-red-500 text-sm mb-2">{errors.carrello}</p>
            )}

            {/* Carrello */}
            <div className="mt-4 border border-gray-200 rounded-lg overflow-visible">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Codice</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-[55%]">Descrizione</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Prezzo</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Q.tà</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Sconto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Importo sconto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Importo</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carrello.map((riga, idx) => {
                    const calc = computeRiga(riga)
                    return (
                      <tr
                        key={idx}
                        ref={(el) => {
                          rowRefs.current[idx] = el
                        }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">
                          <div className="w-24">
                            <input
                              type="text"
                              value={riga.prodotto?.codice_prodotto || riga.codice_input || ''}
                              ref={(el) => {
                                codiceRefs.current[idx] = el
                              }}
                              onChange={(e) => {
                                const next = e.target.value
                                if (riga.prodotto_id) {
                                  handleResetRiga(idx)
                                }
                                handleUpdateRiga(idx, { codice_input: next })
                                openProdottoSearch(idx, next)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !riga.prodotto_id) return
                                if (e.key === 'Backspace' && riga.prodotto_id && !prodottoSearchOpen) {
                                  e.preventDefault()
                                  handleResetRiga(idx)
                                  return
                                }
                              }}
                              className="input"
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-900">{riga.prodotto?.nome || ''}</div>
                          <div className="text-xs text-gray-500">{riga.prodotto?.descrizione || ''}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={riga.prezzo_unitario}
                            onChange={(e) => handleUpdateRiga(idx, { prezzo_unitario: parseLocaleNumber(e.target.value) })}
                            ref={(el) => {
                              prezzoRefs.current[idx] = el
                            }}
                            className="input text-right w-28"
                            step="0.01"
                            min={isScontoExtra(riga) ? undefined : '0'}
                            disabled={!riga.prodotto_id}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={riga.quantita}
                            onChange={(e) => handleUpdateRiga(idx, { quantita: parseLocaleNumber(e.target.value) })}
                            className={`input text-center w-20 ${errors[`quantita_${idx}`] ? 'border-red-500' : ''}`}
                            step="0.01"
                            min="0.01"
                            disabled={!riga.prodotto_id}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={Number(riga.sconto) === 0 ? '' : riga.sconto}
                            onChange={(e) => {
                              const raw = e.target.value
                              handleUpdateRiga(idx, { sconto: raw === '' ? 0 : parseLocaleNumber(raw) })
                            }}
                            className={`input text-right w-24 ${errors[`sconto_${idx}`] ? 'border-red-500' : ''}`}
                            step="0.01"
                            disabled={!riga.prodotto_id || isScontoExtra(riga)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {calc.scontoImporto > 0 ? `- ${formatCurrency(calc.scontoImporto)}` : ''}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {riga.prodotto_id ? formatCurrency(calc.net) : ''}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleClearRiga(idx)}
                            className="text-red-600 hover:text-red-800"
                            disabled={!riga.prodotto_id}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tipo Vendita Espositori */}
          {hasEspositori && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Tipo Vendita Espositori
              </h3>
              <div className="flex gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="diretto"
                    checked={tipoVenditaEspositori === 'diretto'}
                    onChange={() => setTipoVenditaEspositori('diretto')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Vendita Diretta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="leasing_standard"
                    checked={tipoVenditaEspositori === 'leasing_standard'}
                    onChange={() => setTipoVenditaEspositori('leasing_standard')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Leasing Grenke — Colori Standard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="leasing_personalizzato"
                    checked={tipoVenditaEspositori === 'leasing_personalizzato'}
                    onChange={() => setTipoVenditaEspositori('leasing_personalizzato')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900">Leasing Grenke — Colore Personalizzato</span>
                </label>
              </div>
            </div>
          )}

          {/* Totali */}
          <div className="card bg-gray-50">
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Totale:</span>
                <span className="text-primary-600 font-bold">{formatCurrency(totale)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note Ordine</label>
            <textarea
              name="note"
              value={formData.note ?? ''}
              onChange={(e) => {
                const { name, value } = e.target
                setFormData(prev => ({ ...prev, [name]: value }))
              }}
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
              disabled={saving || carrello.filter(r => r.prodotto_id).length === 0}
            >
              {saving ? 'Salvataggio...' : ordine ? 'Salva Modifiche' : 'Crea Ordine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}