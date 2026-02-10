import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']

interface ClienteAutocompleteProps {
  clienti: Cliente[]
  selectedClienteId: string
  onSelect: (cliente: Cliente) => void
  onClear: () => void
  placeholder?: string
}

export default function ClienteAutocomplete({
  clienti,
  selectedClienteId,
  onSelect,
  onClear,
  placeholder = 'Cerca cliente...',
}: ClienteAutocompleteProps) {
  const selectedCliente = useMemo(
    () => (clienti || []).find(c => c.id === selectedClienteId) || null,
    [clienti, selectedClienteId]
  )

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selectedClienteId) {
      setQuery(selectedCliente?.ragione_sociale || '')
    }
  }, [selectedClienteId])

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clienti || []
    return (clienti || []).filter(c => c.ragione_sociale.toLowerCase().includes(q))
  }, [clienti, query])

  const handleChange = (value: string) => {
    setQuery(value)
    setIsOpen(true)

    if (selectedClienteId) {
      onClear()
    }
  }

  const handleClearButton = () => {
    setQuery('')
    setIsOpen(false)
    if (selectedClienteId) {
      onClear()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="input pl-10 pr-10"
          placeholder={placeholder}
          autoComplete="off"
        />
        {(query || selectedClienteId) && (
          <button
            type="button"
            onClick={handleClearButton}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Pulisci"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filtered.slice(0, 50).map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => {
                onSelect(cliente)
                setIsOpen(false)
                setQuery(cliente.ragione_sociale)
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                selectedClienteId === cliente.id ? 'bg-green-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{cliente.ragione_sociale}</div>
            </button>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && query.trim() !== '' && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-3 py-2 text-sm text-gray-500">Nessun cliente trovato</div>
        </div>
      )}
    </div>
  )
}
