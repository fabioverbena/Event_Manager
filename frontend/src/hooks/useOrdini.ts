import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row']
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
type OrdineUpdate = Database['public']['Tables']['ordini']['Update']
type RigaOrdine = Database['public']['Tables']['righe_ordine']['Row']

export interface OrdineCompleto extends Ordine {
  clienti?: {
    ragione_sociale: string
    nome_referente: string | null
  }
  righe_ordine?: Array<RigaOrdine & {
    prodotti?: {
      codice_prodotto: string
      nome: string
    }
  }>
}

export function useOrdini() {
  const [ordini, setOrdini] = useState<OrdineCompleto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrdini = async () => {
    try {
      const { data, error } = await supabase
        .from('ordini')
        .select(`
          *,
          clienti (
            ragione_sociale,
            nome_referente
          ),
          righe_ordine (
            *,
            prodotti (
              codice_prodotto,
              nome
            )
          )
        `)
        .order('data_ordine', { ascending: false })

      if (error) throw error
      setOrdini(data || [])
    } catch (error) {
      console.error('Errore caricamento ordini:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdini()
  }, [])

  const createOrdine = async (ordine: OrdineInsert, righe: any[]) => {
    try {
      // Crea ordine
      const { data: nuovoOrdine, error: ordineError } = await supabase
        .from('ordini')
        .insert(ordine)
        .select()
        .single()

      if (ordineError) throw ordineError

      // Crea righe ordine
      const righeConOrdineId = righe.map(riga => ({
        ...riga,
        ordine_id: nuovoOrdine.id
      }))

      const { error: righeError } = await supabase
        .from('righe_ordine')
        .insert(righeConOrdineId)

      if (righeError) throw righeError

      // Ricalcola totali
      const subtotaleCalcolato = righe.reduce((sum, r) => sum + (r.subtotale_riga || 0), 0)
      
      const scontoCalcolato = ordine.sconto_percentuale && ordine.sconto_percentuale > 0
        ? (subtotaleCalcolato * ordine.sconto_percentuale) / 100
        : ordine.sconto_valore || 0

      const totaleCalcolato = subtotaleCalcolato - scontoCalcolato

      // Aggiorna ordine con totali corretti
      const { error: updateError } = await supabase
        .from('ordini')
        .update({
          subtotale: subtotaleCalcolato,
          sconto_valore: scontoCalcolato,
          totale: totaleCalcolato
        })
        .eq('id', nuovoOrdine.id)

      if (updateError) throw updateError

      await fetchOrdini()
      return { success: true, data: nuovoOrdine }
    } catch (error) {
      console.error('Errore creazione ordine:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' }
    }
  }

  const updateOrdine = async (id: string, ordine: OrdineUpdate, righe?: any[]) => {
    try {
      // Aggiorna ordine
      const { error: ordineError } = await supabase
        .from('ordini')
        .update(ordine)
        .eq('id', id)

      if (ordineError) throw ordineError

      // Se ci sono righe, aggiorna anche quelle
      if (righe) {
        // Cancella righe esistenti
        const { error: deleteError } = await supabase
          .from('righe_ordine')
          .delete()
          .eq('ordine_id', id)

        if (deleteError) throw deleteError

        // Inserisci nuove righe
        const righeConOrdineId = righe.map(riga => ({
          ...riga,
          ordine_id: id
        }))

        const { error: righeError } = await supabase
          .from('righe_ordine')
          .insert(righeConOrdineId)

        if (righeError) throw righeError

        // Ricalcola totali
        const subtotaleCalcolato = righe.reduce((sum, r) => sum + (r.subtotale_riga || 0), 0)
        
        console.log('Subtotale calcolato da righe:', subtotaleCalcolato)

        const scontoCalcolato = ordine.sconto_percentuale && ordine.sconto_percentuale > 0
          ? (subtotaleCalcolato * ordine.sconto_percentuale) / 100
          : ordine.sconto_valore || 0

        const totaleCalcolato = subtotaleCalcolato - scontoCalcolato

        // Aggiorna ordine con totali corretti
        const { error: updateError } = await supabase
          .from('ordini')
          .update({
            subtotale: subtotaleCalcolato,
            sconto_valore: scontoCalcolato,
            totale: totaleCalcolato
          })
          .eq('id', id)

        if (updateError) throw updateError
      }

      await fetchOrdini()
      return { success: true }
    } catch (error) {
      console.error('Errore aggiornamento ordine:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' }
    }
  }

  const deleteOrdine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ordini')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchOrdini()
      return { success: true }
    } catch (error) {
      console.error('Errore eliminazione ordine:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' }
    }
  }

  return {
    ordini,
    loading,
    fetchOrdini,
    createOrdine,
    updateOrdine,
    deleteOrdine
  }
}