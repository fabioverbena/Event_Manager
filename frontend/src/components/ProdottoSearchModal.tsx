import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'

interface Prodotto {
  id: string
  codice_prodotto: string
  nome: string
  descrizione?: string | null
  prezzo_listino: number
}

interface ProdottoSearchModalProps {
  open: boolean
  query: string
  setQuery: (value: string) => void
  prodotti: Prodotto[]
  onSelect: (prodotto: Prodotto) => void
  onClose: () => void
}

export default function ProdottoSearchModal({ open, query, setQuery, prodotti, onSelect, onClose }: ProdottoSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return prodotti
    return prodotti.filter(p => {
      const nome = String(p.nome || '').toLowerCase()
      const codice = String(p.codice_prodotto || '').toLowerCase()
      const descr = String(p.descrizione || '').toLowerCase()
      return nome.includes(q) || codice.includes(q) || descr.includes(q)
    })
  }, [prodotti, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Seleziona Prodotto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="label">Cerca</label>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input"
              placeholder="Digita codice o descrizione..."
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Codice</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Descrizione</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Prezzo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50 cursor-pointer"
                      onClick={() => onSelect(p)}
                    >
                      <td className="px-3 py-2 text-sm font-semibold text-gray-900">{p.codice_prodotto}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{p.nome}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{p.descrizione || ''}</td>
                      <td className="px-3 py-2 text-sm text-right font-semibold text-gray-900">
                        {p.prezzo_listino.toFixed(2).replace('.', ',')} €
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                        Nessun prodotto trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
