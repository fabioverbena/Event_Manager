import { useState } from 'react'
import { X, FileText, Printer } from 'lucide-react'
import { generateOrdinePDF, generatePreventivoPDF } from '@/lib/pdfGenerator'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row'] & {
  clienti?: {
    ragione_sociale: string
  } | null
}

type TipoDocumento = 'ordine' | 'preventivo'

interface StampaOrdineModalProps {
  ordine: Ordine
  onClose: () => void
}

export default function StampaOrdineModal({ ordine, onClose }: StampaOrdineModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('ordine')
  const [numeroCopie, setNumeroCopie] = useState<number>(1)

  const handleStampa = async () => {
    if (tipoDocumento === 'preventivo') {
      await generatePreventivoPDF(ordine as any, numeroCopie)
    } else {
      await generateOrdinePDF(ordine as any, numeroCopie)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Stampa Documento</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Ordine</div>
            <div className="font-semibold text-gray-900">
              #{ordine.numero_ordine.toString().padStart(4, '0')} {ordine.clienti?.ragione_sociale ? `- ${ordine.clienti.ragione_sociale}` : ''}
            </div>
          </div>

          <div>
            <label className="label">
              Tipo Documento <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => setTipoDocumento('ordine')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoDocumento === 'ordine'
                    ? 'border-green-600 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-semibold">Ordine</div>
              </button>
              <button
                onClick={() => setTipoDocumento('preventivo')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoDocumento === 'preventivo'
                    ? 'border-green-600 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-semibold">Preventivo</div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">
              Numero Copie <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setNumeroCopie(Math.max(1, numeroCopie - 1))}
                className="btn-secondary w-10 h-10 flex items-center justify-center text-xl"
                disabled={numeroCopie <= 1}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={numeroCopie}
                onChange={(e) => setNumeroCopie(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="input text-center text-xl font-bold w-20"
              />
              <button
                onClick={() => setNumeroCopie(Math.min(20, numeroCopie + 1))}
                className="btn-secondary w-10 h-10 flex items-center justify-center text-xl"
                disabled={numeroCopie >= 20}
              >
                +
              </button>
              <span className="text-gray-600">{numeroCopie === 1 ? '1 copia' : `${numeroCopie} copie`}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t">
          <button onClick={onClose} className="btn-secondary">
            Annulla
          </button>
          <button onClick={handleStampa} className="btn-primary flex items-center gap-2">
            <Printer size={20} />
            Stampa
          </button>
        </div>
      </div>
    </div>
  )
}
