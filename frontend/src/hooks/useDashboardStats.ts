import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalClienti: number
  totalProdotti: number
  totalOrdini: number
  valoreOrdini: number
  loading: boolean
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClienti: 0,
    totalProdotti: 0,
    totalOrdini: 0,
    valoreOrdini: 0,
    loading: true,
  })

  const fetchStats = async () => {
    console.log('🔍 [useDashboardStats] Inizio fetchStats')
    
    try {
      // Conta clienti attivi
      console.log('📊 Fetching clienti...')
      const { count: clientiCount, error: clientiError } = await supabase
        .from('clienti')
        .select('*', { count: 'exact', head: true })
        .eq('attivo', true)

      console.log('✅ Clienti count:', clientiCount, 'Error:', clientiError)

      // Conta prodotti disponibili
      console.log('📊 Fetching prodotti...')
      const { count: prodottiCount, error: prodottiError } = await supabase
        .from('prodotti')
        .select('*', { count: 'exact', head: true })
        .eq('disponibile', true)

      console.log('✅ Prodotti count:', prodottiCount, 'Error:', prodottiError)

      // Conta ordini totali (esclusi annullati)
      console.log('📊 Fetching ordini...')
      const { count: ordiniCount, error: ordiniError } = await supabase
        .from('ordini')
        .select('*', { count: 'exact', head: true })
        .neq('stato', 'annullato')

      console.log('✅ Ordini count:', ordiniCount, 'Error:', ordiniError)

      // Somma valore ordini (esclusi annullati)
      console.log('📊 Fetching valore ordini...')
      const { data: ordiniData, error: valoreError } = await supabase
        .from('ordini')
        .select('totale')
        .neq('stato', 'annullato')

      console.log('✅ Ordini data:', ordiniData, 'Error:', valoreError)

      const valoreTotal = ordiniData?.reduce((sum, o) => sum + (o.totale || 0), 0) || 0
      console.log('💰 Valore totale calcolato:', valoreTotal)

      const newStats = {
        totalClienti: clientiCount || 0,
        totalProdotti: prodottiCount || 0,
        totalOrdini: ordiniCount || 0,
        valoreOrdini: valoreTotal,
        loading: false,
      }

      console.log('📈 Setting stats:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('❌ Errore caricamento stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    console.log('🚀 [useDashboardStats] useEffect chiamato')
    fetchStats()
  }, [])

  console.log('📊 [useDashboardStats] Returning stats:', stats)
  return { ...stats, refresh: fetchStats }
}