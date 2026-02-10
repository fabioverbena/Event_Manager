import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Prodotto {
  id: string
  codice_prodotto: string
  nome: string
  prezzo_listino: number
}

interface ProdottoAutocompleteProps {
  prodotti: Prodotto[]
  onSelect: (prodotto: Prodotto) => void
  placeholder?: string
}

export default function ProdottoAutocomplete({ prodotti, onSelect, placeholder }: ProdottoAutocompleteProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filtra prodotti mentre digiti
  const filteredProdotti = search.trim()
    ? prodotti.filter(p => 
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codice_prodotto.toLowerCase().includes(search.toLowerCase())
      )
    : prodotti

  // Chiudi quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Gestisci tasti freccia e Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, filteredProdotti.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredProdotti[highlightedIndex]) {
          handleSelect(filteredProdotti[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSelect = (prodotto: Prodotto) => {
    onSelect(prodotto)
    setSearch(`${prodotto.nome} (${prodotto.codice_prodotto})`)
    setIsOpen(false)
    setHighlightedIndex(0)
  }

  const handleClear = () => {
    setSearch('')
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input di ricerca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Cerca prodotto per nome o codice...'}
          className="input pl-10 pr-10"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Dropdown risultati */}
      {isOpen && filteredProdotti.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredProdotti.slice(0, 50).map((prodotto, index) => (
            <button
              key={prodotto.id}
              type="button"
              onClick={() => handleSelect(prodotto)}
              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{prodotto.nome}</div>
                  <div className="text-sm text-gray-500">{prodotto.codice_prodotto}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-gray-900">
                    {prodotto.prezzo_listino.toFixed(2).replace('.', ',')} €
                  </div>
                </div>
              </div>
            </button>
          ))}
          {filteredProdotti.length > 50 && (
            <div className="px-4 py-2 text-sm text-gray-500 text-center bg-gray-50">
              Mostrati primi 50 di {filteredProdotti.length} risultati. Affina la ricerca...
            </div>
          )}
        </div>
      )}

      {/* Nessun risultato */}
      {isOpen && search && filteredProdotti.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Nessun prodotto trovato per "{search}"
        </div>
      )}
    </div>
  )
}