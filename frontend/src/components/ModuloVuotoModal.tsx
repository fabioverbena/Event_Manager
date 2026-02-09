import { useState, useEffect } from 'react'
import { X, FileText, Printer } from 'lucide-react'
import { generateModuloVuoto } from '@/lib/pdfModuliVuoti'
import { supabase } from '@/lib/supabase'

interface ModuloVuotoModalProps {
  onClose: () => void
  eventoCorrente?: string
}

type TipoModulo = 'Espositori' | 'Ricambi' | 'Gemme' | 'Nido'

export default function ModuloVuotoModal({ onClose, eventoCorrente }: ModuloVuotoModalProps) {
  const [tipoSelezionato, setTipoSelezionato] = useState<TipoModulo>('Espositori')
  const [numeroCopie, setNumeroCopie] = useState<number>(1)
  const [prodotti, setProdotti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProdotti()
  }, [])

  const fetchProdotti = async () => {
    try {
      const { data, error } = await supabase
        .from('prodotti')
        .select('codice_prodotto, nome, prezzo_listino, categorie(nome, tipo_ordine)')        .eq('disponibile', true)
        .order('nome')

      if (error) throw error
      setProdotti(data || [])
    } catch (error) {
      console.error('Errore caricamento prodotti:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStampa = () => {
    generateModuloVuoto(tipoSelezionato, numeroCopie, prodotti, eventoCorrente)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Stampa Moduli Vuoti</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selezione Tipo Modulo */}
          <div>
            <label className="label">
              Tipo Modulo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {(['Espositori', 'Ricambi', 'Gemme', 'Nido'] as TipoModulo[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoSelezionato(tipo)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    tipoSelezionato === tipo
                      ? 'border-green-600 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-semibold">{tipo}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tipo === 'Espositori' && 'Leo2-Leo5, Titano, Zen'}
                    {tipo === 'Ricambi' && 'Motori, Componenti'}
                    {tipo === 'Gemme' && 'Set Premium'}
                    {tipo === 'Nido' && 'Prodotti Nido'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Numero Copie */}
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
              <span className="text-gray-600">
                {numeroCopie === 1 ? '1 copia' : `${numeroCopie} copie`}
              </span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Anteprima Modulo</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Logo e intestazione Fior d'Acqua</li>
                  {eventoCorrente && <li>• Evento: <strong>{eventoCorrente}</strong></li>}
                  <li>• Campi cliente completi</li>
                  {loading ? (
                    <li>• Caricamento prodotti...</li>
                  ) : (
                    <li>• Tabella con {prodotti.length > 0 ? `${prodotti.length} prodotti` : '18 righe vuote'}</li>
                  )}
                  <li>• Calcolo totali con sconto</li>
                  <li>• Condizioni trasporto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t">
          <button onClick={onClose} className="btn-secondary">
            Annulla
          </button>
          <button 
            onClick={handleStampa} 
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Printer size={20} />
            {loading ? 'Caricamento...' : `Stampa ${numeroCopie} ${numeroCopie === 1 ? 'Modulo' : 'Moduli'}`}
          </button>
        </div>
      </div>
    </div>
  )
}