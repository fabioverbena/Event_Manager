import { useState, useEffect } from 'react'
import { Users, Package, ShoppingCart, TrendingUp, FileText, Calendar, Edit2, Check, X } from 'lucide-react'
import ModuloVuotoModal from '@/components/ModuloVuotoModal'
import { getEventoCorrente, setEventoCorrente } from '@/lib/eventoCorrente'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { formatCurrency } from '@/lib/utils'

export default function Dashboard() {
  const { totalClienti, totalProdotti, totalOrdini, valoreOrdini, loading } = useDashboardStats()
  const [showModulo, setShowModulo] = useState(false)
  const [eventoCorrente, setEventoCorrenteState] = useState<string>('')
  const [editingEvento, setEditingEvento] = useState(false)
  const [tempEvento, setTempEvento] = useState('')

  console.log('📊 Dashboard stats:', { totalClienti, totalProdotti, totalOrdini, valoreOrdini, loading })

  useEffect(() => {
    const evento = getEventoCorrente()
    if (evento) {
      setEventoCorrenteState(evento)
    }
  }, [])

  const handleSalvaEvento = () => {
    if (tempEvento.trim()) {
      setEventoCorrente(tempEvento.trim())
      setEventoCorrenteState(tempEvento.trim())
      setEditingEvento(false)
    }
  }

  const handleEditEvento = () => {
    setTempEvento(eventoCorrente)
    setEditingEvento(true)
  }

  return (
    <div>
      {/* Box Evento Corrente */}
      {eventoCorrente && !editingEvento && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-green-700 font-medium">Evento Corrente</p>
                <p className="text-xl font-bold text-green-900">{eventoCorrente}</p>
              </div>
            </div>
            <button
              onClick={handleEditEvento}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Modifica evento"
            >
              <Edit2 size={20} />
            </button>
          </div>
        </div>
      )}

      {editingEvento && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <input
              type="text"
              value={tempEvento}
              onChange={(e) => setTempEvento(e.target.value)}
              placeholder="es: IPM Essen 2026"
              className="input flex-1"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleSalvaEvento()}
            />
            <button
              onClick={handleSalvaEvento}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
              title="Salva"
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => setEditingEvento(false)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Annulla"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {!eventoCorrente && !editingEvento && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-yellow-600" size={24} />
              <div>
                <p className="text-sm text-yellow-700 font-medium">Nessun evento impostato</p>
                <p className="text-sm text-yellow-600">Imposta l'evento corrente per pre-popolare ordini e moduli</p>
              </div>
            </div>
            <button
              onClick={() => {
                setTempEvento('')
                setEditingEvento(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Calendar size={18} />
              Imposta Evento
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Panoramica generale</p>
        </div>
        <button 
          onClick={() => setShowModulo(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FileText size={20} />
          Stampa Moduli
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clienti Totali</p>
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{totalClienti}</p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Clienti attivi</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Prodotti</p>
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{totalProdotti}</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Disponibili</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ordini Totali</p>
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-9 w-16 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{totalOrdini}</p>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Esclusi annullati</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valore Ordini</p>
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-9 w-24 rounded"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(valoreOrdini)}</p>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">Fatturato totale</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="space-y-3">
            <a href="/clienti" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="text-blue-600" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Gestisci Clienti</h3>
                  <p className="text-sm text-gray-600">Aggiungi o modifica clienti</p>
                </div>
              </div>
            </a>
            <a href="/prodotti" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Package className="text-green-600" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Gestisci Prodotti</h3>
                  <p className="text-sm text-gray-600">Catalogo e disponibilità</p>
                </div>
              </div>
            </a>
            <a href="/ordini" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-purple-600" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Nuovo Ordine</h3>
                  <p className="text-sm text-gray-600">Crea ordine fiera</p>
                </div>
              </div>
            </a>
            <button 
              onClick={() => setShowModulo(true)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="text-orange-600" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Stampa Moduli Vuoti</h3>
                  <p className="text-sm text-gray-600">Form per ordini in fiera</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Attività Recente</h2>
          <div className="text-center py-12 text-gray-500">
            <p>Nessuna attività recente</p>
            <p className="text-sm mt-2">Inizia creando il tuo primo ordine!</p>
          </div>
        </div>
      </div>

      {showModulo && (
        <ModuloVuotoModal 
          onClose={() => setShowModulo(false)}
          eventoCorrente={eventoCorrente}
        />
      )}
    </div>
  )
}