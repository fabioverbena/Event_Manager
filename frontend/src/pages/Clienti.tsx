import { useState } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useClienti } from '@/hooks/useClienti'
import ClienteForm from '@/components/ClienteForm'
import ClientiTable from '@/components/ClientiTable'
import { SUCCESS_MESSAGES } from '@/lib/constants'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']
type ClienteInsert = Database['public']['Tables']['clienti']['Insert']

export default function Clienti() {
  const { 
    clienti, 
    loading, 
    error, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    searchClienti,
    fetchClienti 
  } = useClienti()

  const [showForm, setShowForm] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleOpenNew = () => {
    setEditingCliente(null)
    setShowForm(true)
  }

  const handleOpenEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCliente(null)
  }

  const handleSave = async (data: ClienteInsert) => {
    if (editingCliente) {
      const result = await updateCliente(editingCliente.id, data)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.CLIENTE_UPDATED)
      }
    } else {
      const result = await createCliente(data)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.CLIENTE_CREATED)
      }
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteCliente(id)
    if (result.success) {
      showSuccess(SUCCESS_MESSAGES.CLIENTE_DELETED)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === '') {
      fetchClienti()
    } else {
      searchClienti(query)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
          <p className="text-gray-600 mt-1">Gestisci l'anagrafica clienti</p>
        </div>
        <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Nuovo Cliente
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

      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Cerca per ragione sociale..."
            value={searchQuery}
            onChange={handleSearch}
            className="input pl-10"
          />
        </div>
        <button
          onClick={fetchClienti}
          className="btn-secondary flex items-center gap-2"
          title="Ricarica"
        >
          <RefreshCw size={20} />
          <span className="hidden sm:inline">Ricarica</span>
        </button>
      </div>

      {loading && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      )}

      {!loading && (
        <ClientiTable
          clienti={clienti}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <ClienteForm
          cliente={editingCliente}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
