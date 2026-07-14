import { useState } from 'react'
import { Pencil, Trash2, Mail, Phone } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']

interface ClientiTableProps {
  clienti: Cliente[]
  onEdit: (cliente: Cliente) => void
  onDelete: (id: string) => void
}

export default function ClientiTable({ clienti, onEdit, onDelete }: ClientiTableProps) {
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

  if (clienti.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Nessun cliente presente. Crea il tuo primo cliente!
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
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contatti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Località
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P.IVA / CF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creato il
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clienti.map((cliente) => (
              <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary-700 font-semibold text-sm">
                        {getInitials(cliente.ragione_sociale)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {cliente.ragione_sociale}
                      </div>
                      {cliente.nome_referente && (
                        <div className="text-sm text-gray-500">
                          {cliente.nome_referente}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {cliente.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-2 text-gray-400" />
                        {cliente.email}
                      </div>
                    )}
                    {(cliente.telefono || cliente.cellulare) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone size={14} className="mr-2 text-gray-400" />
                        {cliente.cellulare || cliente.telefono}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {cliente.citta && (
                    <div>
                      {cliente.citta}
                      {cliente.provincia && ` (${cliente.provincia})`}
                    </div>
                  )}
                  {cliente.cap && (
                    <div className="text-gray-400 text-xs">{cliente.cap}</div>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {cliente.partita_iva && (
                    <div className="font-mono">{cliente.partita_iva}</div>
                  )}
                  {cliente.codice_fiscale && (
                    <div className="font-mono text-xs text-gray-400">
                      {cliente.codice_fiscale}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(cliente.created_at)}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === cliente.id
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === cliente.id ? 'Clicca per confermare' : 'Elimina'}
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
          Totale: <span className="font-semibold">{clienti.length}</span> {clienti.length === 1 ? 'cliente' : 'clienti'}
        </p>
      </div>
    </div>
  )
}