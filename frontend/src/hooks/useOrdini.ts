import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'
import { useClienti } from '@/hooks/useClienti'
import { useProdotti } from '@/hooks/useProdotti'

type Ordine = Database['public']['Tables']['ordini']['Row']
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
type OrdineUpdate = Database['public']['Tables']['ordini']['Update']
type RigaOrdine = Database['public']['Tables']['righe_ordine']['Row']
type RigaOrdineInsert = Database['public']['Tables']['righe_ordine']['Insert']

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
  const [error, setError] = useState<string | null>(null)

  const { clienti } = useClienti()
  const { prodotti } = useProdotti()

  const fetchOrdini = async () => {
    try {
      setLoading(true)
      setError(null)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento ordini')
      console.error('Errore caricamento ordini:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdineCompleto = async (id: string) => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
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
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return { success: true as const, data: data as OrdineCompleto }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore caricamento ordine'
      setError(message)
      return { success: false as const, error: message }
    }
  }

  useEffect(() => {
    fetchOrdini()
  }, [])

  const createOrdine = async (ordine: OrdineInsert, righe: RigaOrdineInsert[]) => {
    try {
      setError(null)
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(message)
      console.error('Errore creazione ordine:', err)
      return { success: false, error: message }
    }
  }

  const updateOrdine = async (id: string, ordine: OrdineUpdate, righe?: RigaOrdineInsert[]) => {
    try {
      setError(null)
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(message)
      console.error('Errore aggiornamento ordine:', err)
      return { success: false, error: message }
    }
  }

  const deleteOrdine = async (id: string) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('ordini')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchOrdini()
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(message)
      console.error('Errore eliminazione ordine:', err)
      return { success: false, error: message }
    }
  }

  const cambiaStato = async (
    id: string,
    stato: Database['public']['Tables']['ordini']['Row']['stato']
  ) => {
    return updateOrdine(id, { stato })
  }

  return {
    ordini,
    clienti,
    prodotti,
    loading,
    error,
    fetchOrdini,
    fetchOrdineCompleto,
    createOrdine,
    updateOrdine,
    deleteOrdine,
    cambiaStato,
  }
}