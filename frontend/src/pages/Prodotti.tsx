import { useState } from 'react'
import { Search, Plus, RefreshCw, Upload } from 'lucide-react'
import { useProdotti } from '@/hooks/useProdotti'
import ProdottoForm from '@/components/ProdottoForm'
import ProdottiTable from '@/components/ProdottiTable'
import ImportCSV from '@/components/ImportCSV'
import { SUCCESS_MESSAGES } from '@/lib/constants'
import type { Database } from '@/types/database.types'

type Prodotto = Database['public']['Tables']['prodotti']['Row']
type ProdottoInsert = Database['public']['Tables']['prodotti']['Insert']

export default function Prodotti() {
  const { 
    prodotti, 
    categorie,
    loading, 
    error, 
    createProdotto, 
    updateProdotto, 
    deleteProdotto,
    searchProdotti,
    fetchProdotti,
    generateCodiceProdotto,
  } = useProdotti()

  const [showForm, setShowForm] = useState(false)
  const [editingProdotto, setEditingProdotto] = useState<Prodotto | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const handleOpenNew = () => {
    setEditingProdotto(null)
    setShowForm(true)
  }

  const handleOpenEdit = (prodotto: Prodotto) => {
    setEditingProdotto(prodotto)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProdotto(null)
  }

  const handleSave = async (data: ProdottoInsert) => {
    if (editingProdotto) {
      const result = await updateProdotto(editingProdotto.id, data)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.PRODOTTO_UPDATED)
      }
    } else {
      const result = await createProdotto(data)
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.PRODOTTO_CREATED)
      }
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteProdotto(id)
    if (result.success) {
      showSuccess(SUCCESS_MESSAGES.PRODOTTO_DELETED)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === '') {
      fetchProdotti()
    } else {
      searchProdotti(query)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleImportCSV = async (data: any[]) => {
    const errors: string[] = []
    let successCount = 0
  
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      try {
        // Trova categoria per nome
        const categoria = categorie.find(c => 
          c.nome.toLowerCase() === row.categoria?.toLowerCase()
        )
        
        if (!categoria) {
          errors.push(`Riga ${i + 1}: categoria "${row.categoria}" non trovata`)
          continue
        }
  
        // USA CODICE ESISTENTE se presente, altrimenti genera
        let codice: string
        if (row.codice_prodotto?.trim()) {
          codice = row.codice_prodotto.trim()
        } else {
          codice = await generateCodiceProdotto(row.nome)
        }
  
        const prodottoData: ProdottoInsert = {
          categoria_id: categoria.id,
          codice_prodotto: codice,
          nome: row.nome,
          descrizione: row.descrizione || null,
          prezzo_listino: parseFloat(row.prezzo_listino) || 0,
          unita_misura: row.unita_misura || 'pz',
          disponibile: row.disponibile?.toLowerCase() !== 'no',
          note: row.note || null,
        }
  
        const result = await createProdotto(prodottoData)
        if (result.success) {
          successCount++
        } else {
          errors.push(`Riga ${i + 1}: ${result.error}`)
        }
      } catch (err) {
        errors.push(`Riga ${i + 1}: errore imprevisto`)
      }
    }
  
    return { success: successCount, errors }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prodotti</h1>
          <p className="text-gray-600 mt-1">Gestisci il catalogo prodotti</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={20} />
            Importa CSV
          </button>
          <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Nuovo Prodotto
          </button>
        </div>
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
            placeholder="Cerca per nome o codice prodotto..."
            value={searchQuery}
            onChange={handleSearch}
            className="input pl-10"
          />
        </div>
        <button
          onClick={fetchProdotti}
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
        <ProdottiTable
          prodotti={prodotti}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <ProdottoForm
          prodotto={editingProdotto}
          categorie={categorie}
          onClose={handleCloseForm}
          onSave={handleSave}
          onGenerateCodice={generateCodiceProdotto}
        />
      )}

      {showImport && (
        <ImportCSV
          title="Import Prodotti"
          onImport={handleImportCSV}
          onClose={() => setShowImport(false)}
          columns={[
            { key: 'codice_prodotto', label: 'Codice Prodotto' },
            { key: 'codice_prodotto', label: 'Codice Prodotto' },
            { key: 'nome', label: 'Nome Prodotto', required: true },
            { key: 'categoria', label: 'Categoria', required: true },
            { key: 'prezzo_listino', label: 'Prezzo', required: true },
            { key: 'unita_misura', label: 'Unità Misura' },
            { key: 'descrizione', label: 'Descrizione' },
            { key: 'disponibile', label: 'Disponibile' },
            { key: 'note', label: 'Note' },
          ]}
          templateExample={[
            'codice_prodotto,nome,categoria,prezzo_listino,unita_misura,descrizione,disponibile,note',
            'LEO2-001,Espositore Refrigerato Medio,Nuovi,1500.00,pz,Espositore per fiori recisi,si,',
            'Ricambio Motore Standard,Ricambi,250.00,pz,Motore di ricambio universale,si,',
            'Gemme Premium Box,Gemme,89.90,set,Set 12 gemme assortite,si,',
          ]}
        />
      )}
    </div>
  )
}