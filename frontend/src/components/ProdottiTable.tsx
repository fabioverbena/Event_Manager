import { useState } from 'react'
import { Pencil, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Prodotto = Database['public']['Tables']['prodotti']['Row'] & {
  categorie?: {
    nome: string
    parent_id: string | null
  } | null
}

interface ProdottiTableProps {
  prodotti: Prodotto[]
  onEdit: (prodotto: Prodotto) => void
  onDelete: (id: string) => void
}

export default function ProdottiTable({ prodotti, onEdit, onDelete }: ProdottiTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (prodotti.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Nessun prodotto presente. Crea il tuo primo prodotto!
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prodotto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prezzo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                U.M.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prodotti.map((prodotto) => (
              <tr key={prodotto.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Package className="text-green-600" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {prodotto.nome}
                      </div>
                      {prodotto.descrizione && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {prodotto.descrizione}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {prodotto.codice_prodotto}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {prodotto.categorie?.nome || 'N/A'}
                </td>

                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(prodotto.prezzo_listino)}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {prodotto.unita_misura}
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prodotto.disponibile 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {prodotto.disponibile ? 'Disponibile' : 'Non disponibile'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(prodotto)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(prodotto.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === prodotto.id
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === prodotto.id ? 'Clicca per confermare' : 'Elimina'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Totale: <span className="font-semibold">{prodotti.length}</span> {prodotti.length === 1 ? 'prodotto' : 'prodotti'}
        </p>
      </div>
    </div>
  )
}