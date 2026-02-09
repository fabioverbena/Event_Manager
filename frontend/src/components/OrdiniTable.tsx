// @ts-nocheck
import { useState } from 'react'
import { Pencil, Trash2, FileText, CheckCircle, XCircle, Clock, Printer, Eye } from 'lucide-react'
import { formatCurrency, formatDate, getStatoBadgeColor } from '@/lib/utils'
import { generateOrdinePDF } from '@/lib/pdfGenerator'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row'] & {
  clienti?: {
    id: string
    ragione_sociale: string
    citta: string | null
  } | null
}

interface OrdiniTableProps {
  ordini: Ordine[]
  onEdit: (ordine: Ordine) => void
  onDelete: (id: string) => void
  onCambiaStato: (id: string, stato: 'bozza' | 'confermato' | 'evaso' | 'annullato') => void
}

export default function OrdiniTable({ ordini, onEdit, onDelete, onCambiaStato }: OrdiniTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [menuStatoAperto, setMenuStatoAperto] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'confermato':
        return <CheckCircle size={16} className="text-blue-600" />
      case 'evaso':
        return <CheckCircle size={16} className="text-green-600" />
      case 'annullato':
        return <XCircle size={16} className="text-red-600" />
      default:
        return <Clock size={16} className="text-yellow-600" />
    }
  }

  if (ordini.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center py-8">
          Nessun ordine presente. Crea il tuo primo ordine!
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
                Numero
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Totale
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
            {ordini.map((ordine) => (
              <tr key={ordine.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    <span className="font-mono font-semibold text-gray-900">
                      #{ordine.numero_ordine.toString().padStart(4, '0')}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {ordine.nome_evento || 'N/A'}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {ordine.clienti?.ragione_sociale || 'N/A'}
                  </div>
                  {ordine.clienti?.citta && (
                    <div className="text-sm text-gray-500">{ordine.clienti.citta}</div>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(ordine.data_ordine)}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {ordine.ha_espositori && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Espositori
                        {ordine.tipo_vendita_espositori && (
                          <span className="ml-1">
                            ({ordine.tipo_vendita_espositori === 'diretto' ? 'Diretto' : 'Leasing'})
                          </span>
                        )}
                      </span>
                    )}
                    {ordine.ha_altri_prodotti && !ordine.ha_espositori && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Altri prodotti
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(ordine.totale)}
                  </span>
                  {ordine.sconto_percentuale && ordine.sconto_percentuale > 0 && (
                    <div className="text-xs text-gray-500">
                      Sconto {ordine.sconto_percentuale}%
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setMenuStatoAperto(menuStatoAperto === ordine.id ? null : ordine.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatoBadgeColor(ordine.stato)}`}
                    >
                      {getStatoIcon(ordine.stato)}
                      {ordine.stato.charAt(0).toUpperCase() + ordine.stato.slice(1)}
                    </button>
                    
                    {menuStatoAperto === ordine.id && ordine.stato !== 'annullato' && ordine.stato !== 'evaso' && (
                      <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
                        {ordine.stato === 'bozza' && (
                          <button
                            onClick={() => {
                              onCambiaStato(ordine.id, 'confermato')
                              setMenuStatoAperto(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CheckCircle size={14} />
                            Conferma
                          </button>
                        )}
                        {ordine.stato === 'confermato' && (
                          <button
                            onClick={() => {
                              onCambiaStato(ordine.id, 'evaso')
                              setMenuStatoAperto(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <CheckCircle size={14} />
                            Segna Evaso
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onCambiaStato(ordine.id, 'annullato')
                            setMenuStatoAperto(null)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <XCircle size={14} />
                          Annulla
                        </button>
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => generateOrdinePDF(ordine)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Stampa PDF"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(ordine)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={ordine.stato === 'bozza' ? 'Modifica' : 'Visualizza'}
                    >
                      {ordine.stato === 'bozza' ? <Pencil size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(ordine.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === ordine.id
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={deleteConfirm === ordine.id ? 'Clicca per confermare' : 'Elimina'}
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

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Totale: <span className="font-semibold">{ordini.length}</span> {ordini.length === 1 ? 'ordine' : 'ordini'}
        </p>
        <p className="text-sm font-semibold text-gray-900">
          Valore totale: {formatCurrency(ordini.reduce((sum, o) => sum + o.totale, 0))}
        </p>
      </div>
    </div>
  )
}