import { useState } from 'react'
import { Search, Plus, RefreshCw, Filter } from 'lucide-react'
import { useOrdini, type OrdineCompleto } from '@/hooks/useOrdini'
import OrdineForm from '@/components/OrdineForm'
import OrdiniTable from '@/components/OrdiniTable'
import { SUCCESS_MESSAGES } from '@/lib/constants'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row']
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
type RigaOrdineInsert = Database['public']['Tables']['righe_ordine']['Insert']
type RigaOrdineCreate = Omit<RigaOrdineInsert, 'ordine_id'>

export default function Ordini() {
  const { 
    ordini, 
    clienti,
    prodotti,
    loading, 
    error, 
    createOrdine, 
    updateOrdine, 
    deleteOrdine,
    cambiaStato,
    fetchOrdini,
    fetchOrdineCompleto
  } = useOrdini()

  const [showForm, setShowForm] = useState(false)
  const [editingOrdine, setEditingOrdine] = useState<OrdineCompleto | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filtroStato, setFiltroStato] = useState<string>('tutti')
  const [filtroEvento, setFiltroEvento] = useState<string>('tutti')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setEditingOrdine(null)
    setShowForm(true)
  }

  const handleOpenEdit = async (ordine: Ordine) => {
    const result = await fetchOrdineCompleto(ordine.id)
    if (result.success && result.data) {
      setEditingOrdine(result.data)
      setShowForm(true)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingOrdine(null)
  }

  const handleSave = async (data: OrdineInsert, righe: RigaOrdineCreate[]) => {
    if (editingOrdine) {
      const result = await updateOrdine(editingOrdine.id, data, righe)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.ORDINE_UPDATED)
      }
    } else {
      const result = await createOrdine(data, righe)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.ORDINE_CREATED)
      }
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteOrdine(id)
    if (result.success) {
      showSuccess(SUCCESS_MESSAGES.ORDINE_DELETED)
    }
  }

  const handleCambiaStato = async (id: string, nuovoStato: 'bozza' | 'confermato' | 'evaso' | 'annullato') => {
    const result = await cambiaStato(id, nuovoStato)
    if (result.success) {
      showSuccess(`Stato ordine aggiornato a: ${nuovoStato}`)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Filtra ordini
  const ordiniFiltrati = ordini.filter(ordine => {
    // Filtro ricerca
    const matchSearch = searchQuery.trim() === '' || 
      ordine.numero_ordine.toString().includes(searchQuery) ||
      ordine.clienti?.ragione_sociale?.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro stato
    const matchStato = filtroStato === 'tutti' || ordine.stato === filtroStato

    // Filtro evento
    const matchEvento = filtroEvento === 'tutti' || ordine.nome_evento === filtroEvento

    return matchSearch && matchStato && matchEvento
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordini</h1>
          <p className="text-gray-600 mt-1">Gestisci gli ordini fiera</p>
        </div>
        <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Nuovo Ordine
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Cerca per numero ordine o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
            />
            <select
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
              className="input pl-10 pr-8"
            >
              <option value="tutti">Tutti gli stati</option>
              <option value="bozza">Bozza</option>
              <option value="confermato">Confermato</option>
              <option value="evaso">Evaso</option>
              <option value="annullato">Annullato</option>
            </select>
          </div>

          <div className="relative min-w-[200px]">
            <Filter 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={20} 
            />
            <select
              value={filtroEvento}
              onChange={(e) => setFiltroEvento(e.target.value)}
              className="input pl-10 pr-8"
            >
              <option value="tutti">Tutti gli eventi</option>
              {Array.from(
                new Set(
                  ordini
                    .map(o => o.nome_evento)
                    .filter((e): e is string => Boolean(e))
                )
              ).map(evento => (
                <option key={evento} value={evento}>{evento}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchOrdini}
            className="btn-secondary flex items-center gap-2"
            title="Ricarica"
          >
            <RefreshCw size={20} />
            <span className="hidden sm:inline">Ricarica</span>
          </button>
        </div>
      </div>

      {/* Stats rapide */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Bozze</div>
          <div className="text-2xl font-bold text-yellow-600">
            {ordini.filter(o => o.stato === 'bozza').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Confermati</div>
          <div className="text-2xl font-bold text-blue-600">
            {ordini.filter(o => o.stato === 'confermato').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Evasi</div>
          <div className="text-2xl font-bold text-green-600">
            {ordini.filter(o => o.stato === 'evaso').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Annullati</div>
          <div className="text-2xl font-bold text-red-600">
            {ordini.filter(o => o.stato === 'annullato').length}
          </div>
        </div>
      </div>

      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      )}

      {!loading && (
        <OrdiniTable
          ordini={ordiniFiltrati}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onCambiaStato={handleCambiaStato}
        />
      )}

      {showForm && (
        <OrdineForm
          ordine={editingOrdine}
          clienti={clienti}
          prodotti={prodotti}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  )
}