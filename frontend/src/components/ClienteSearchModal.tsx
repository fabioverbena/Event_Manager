import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']

type ClienteSearchMode = 'list' | 'confirm' | 'create'

interface ClienteSearchModalProps {
  open: boolean
  query: string
  setQuery: (next: string) => void
  mode: ClienteSearchMode
  matches: Cliente[]
  onClose: () => void
  onSelect: (cliente: Cliente) => void
  onCreateNew: (ragioneSociale: string) => void
}

export default function ClienteSearchModal({ open, query, setQuery, mode, matches, onClose, onSelect, onCreateNew }: ClienteSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  const normalizedQuery = useMemo(() => query.trim(), [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[250] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Seleziona Cliente</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
            className="input"
            placeholder="Cerca cliente…"
            autoComplete="off"
          />
        </div>

        <div className="p-6 space-y-4">
          {mode === 'confirm' && matches[0] && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Risultato per</div>
                <div className="text-lg font-semibold text-gray-900">{normalizedQuery}</div>
                <div className="mt-3">
                  <div className="text-sm text-gray-500">Cliente trovato</div>
                  <div className="text-base font-semibold text-gray-900">{matches[0].ragione_sociale}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => onCreateNew(normalizedQuery)}>
                  Nuovo cliente
                </button>
                <button type="button" className="btn-primary" onClick={() => onSelect(matches[0])}>
                  Conferma
                </button>
              </div>
            </div>
          )}

          {mode === 'list' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                {normalizedQuery
                  ? (
                    <>Trovati <span className="font-semibold">{matches.length}</span> clienti per "{normalizedQuery}". Seleziona dalla lista.</>
                  )
                  : (
                    <>Trovati <span className="font-semibold">{matches.length}</span> clienti. Seleziona dalla lista.</>
                  )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Ragione Sociale</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Città</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Provincia</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Telefono</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {matches.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() => onSelect(c)}
                        >
                          <td className="px-3 py-2 text-sm font-semibold text-gray-900">{c.ragione_sociale}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{c.citta || ''}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{c.provincia || ''}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{c.telefono || c.cellulare || ''}</td>
                        </tr>
                      ))}

                      {matches.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                            Nessun cliente trovato
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="btn-secondary" onClick={() => onCreateNew(normalizedQuery)}>
                  Nuovo cliente
                </button>
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-500">Nessuna corrispondenza per</div>
                <div className="text-lg font-semibold text-gray-900">{normalizedQuery}</div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Annulla
                </button>
                <button type="button" className="btn-primary" onClick={() => onCreateNew(normalizedQuery)}>
                  Crea nuovo cliente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
