import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row']
type OrdineInsert = Database['public']['Tables']['ordini']['Insert']
type OrdineUpdate = Database['public']['Tables']['ordini']['Update']
type RigaOrdine = Database['public']['Tables']['righe_ordine']['Row']
type RigaOrdineInsert = Database['public']['Tables']['righe_ordine']['Insert']
type Cliente = Database['public']['Tables']['clienti']['Row']
type Prodotto = Database['public']['Tables']['prodotti']['Row']

type ProdottoConCategoria = Prodotto & {
  categorie?: {
    nome: string
    tipo_ordine: 'espositori' | 'non_espositori'
  } | null
}

type RigaOrdineCreate = Omit<RigaOrdineInsert, 'ordine_id'>

export interface OrdineCompleto extends Ordine {
  clienti?: Cliente
  righe_ordine?: (RigaOrdine & {
    prodotti?: Prodotto
  })[]
}

const round2 = (n: unknown) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.round(v * 100) / 100
}

const deriveSubtotaleRiga = (riga: RigaOrdineCreate) => {
  const q = round2((riga as any).quantita)
  const p = round2((riga as any).prezzo_unitario)
  const st = (riga as any).subtotale_riga
  const hasSubtotale = st != null && Number.isFinite(Number(st))
  return hasSubtotale ? round2(st) : round2(q * p)
}

export function useOrdini() {
  const [ordini, setOrdini] = useState<OrdineCompleto[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [prodotti, setProdotti] = useState<ProdottoConCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClienti = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clienti')
        .select('*')
        .eq('attivo', true)
        .order('ragione_sociale', { ascending: true })

      if (fetchError) throw fetchError
      setClienti(data || [])
    } catch (err) {
      console.error('Errore fetch clienti:', err)
    }
  }

  const fetchProdotti = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('prodotti')
        .select('*, categorie(nome, tipo_ordine)')
        .eq('disponibile', true)
        .order('nome', { ascending: true })

      if (fetchError) throw fetchError
      setProdotti(data || [])
    } catch (err) {
      console.error('Errore fetch prodotti:', err)
    }
  }

  const fetchOrdini = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('ordini')
        .select('*, clienti(*), righe_ordine(*, prodotti(id, nome, codice_prodotto))')
        .order('numero_ordine', { ascending: false })
        .order('ordine_riga', { ascending: true, foreignTable: 'righe_ordine' })

      if (fetchError) throw fetchError

      setOrdini(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento ordini')
      console.error('Errore fetch ordini:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdineCompleto = async (id: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ordini')
        .select('*, clienti(*), righe_ordine(*, prodotti(*))')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Errore' }
    }
  }

  const createOrdine = async (ordine: OrdineInsert, righe: RigaOrdineCreate[]) => {
    try {
      // Forza calcoli corretti
      const grossCalcolato = righe.reduce((sum, r) => sum + round2(round2(r.prezzo_unitario) * round2(r.quantita)), 0)
      const netCalcolato = righe.reduce((sum, r) => sum + deriveSubtotaleRiga(r), 0)
      const scontoRighe = Math.max(0, round2(grossCalcolato - netCalcolato))
      const scontoOrdine = ordine.sconto_percentuale && ordine.sconto_percentuale > 0
        ? round2((netCalcolato * ordine.sconto_percentuale) / 100)
        : 0
      const scontoCalcolato = round2(scontoRighe + scontoOrdine)
      const totaleCalcolato = round2(grossCalcolato - scontoCalcolato)

      // Crea ordine con totali corretti
      const { data: ordineData, error: ordineError } = await supabase
        .from('ordini')
        .insert({
          ...ordine,
          subtotale: grossCalcolato,
          sconto_valore: scontoCalcolato,
          totale: totaleCalcolato
        })
        .select()
        .single()

      if (ordineError) throw ordineError

      // Crea righe ordine
      const righeConOrdineId = righe.map(riga => ({
        ...riga,
        ordine_id: ordineData.id,
        quantita: round2(riga.quantita),
        prezzo_unitario: round2(riga.prezzo_unitario),
        subtotale_riga: deriveSubtotaleRiga(riga),
      }))

      const { error: righeError } = await supabase
        .from('righe_ordine')
        .insert(righeConOrdineId)

      if (righeError) throw righeError

      // Ricarica ordini
      await fetchOrdini()

      return { success: true, data: ordineData }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nella creazione ordine'
      setError(message)
      return { success: false, error: message }
    }
  }

  const updateOrdine = async (id: string, updates: OrdineUpdate, righe?: RigaOrdineCreate[]) => {
    try {
      // Forza calcoli corretti se ci sono righe
      let updatesFinali = updates
      if (righe) {
        const grossCalcolato = righe.reduce((sum, r) => sum + round2(round2(r.prezzo_unitario) * round2(r.quantita)), 0)
        const netCalcolato = righe.reduce((sum, r) => sum + deriveSubtotaleRiga(r), 0)
        const scontoRighe = Math.max(0, round2(grossCalcolato - netCalcolato))
        const scontoOrdine = updates.sconto_percentuale && updates.sconto_percentuale > 0
          ? round2((netCalcolato * updates.sconto_percentuale) / 100)
          : 0
        const scontoCalcolato = round2(scontoRighe + scontoOrdine)
        const totaleCalcolato = round2(grossCalcolato - scontoCalcolato)
        
        updatesFinali = {
          ...updates,
          subtotale: grossCalcolato,
          sconto_valore: scontoCalcolato,
          totale: totaleCalcolato
        }
      }

      // Aggiorna ordine
      const { data: ordineData, error: ordineError } = await supabase
        .from('ordini')
        .update(updatesFinali)
        .eq('id', id)
        .select()
        .single()

      if (ordineError) throw ordineError

      // Se ci sono nuove righe, cancella le vecchie e inserisci le nuove
      if (righe) {
        // Cancella righe vecchie
        const { error: deleteError } = await supabase
          .from('righe_ordine')
          .delete()
          .eq('ordine_id', id)

        if (deleteError) throw deleteError

        // Inserisci righe nuove
        const righeConOrdineId = righe.map(riga => ({
          ...riga,
          ordine_id: id,
          quantita: round2(riga.quantita),
          prezzo_unitario: round2(riga.prezzo_unitario),
          subtotale_riga: deriveSubtotaleRiga(riga),
        }))

        const { error: righeError } = await supabase
          .from('righe_ordine')
          .insert(righeConOrdineId)

        if (righeError) throw righeError
      }

      // Ricarica ordini
      await fetchOrdini()

      return { success: true, data: ordineData }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'aggiornamento ordine'
      setError(message)
      return { success: false, error: message }
    }
  }

  const deleteOrdine = async (id: string) => {
    try {
      // Cancella prima le righe
      const { error: righeError } = await supabase
        .from('righe_ordine')
        .delete()
        .eq('ordine_id', id)

      if (righeError) throw righeError

      // Poi cancella l'ordine
      const { error: ordineError } = await supabase
        .from('ordini')
        .delete()
        .eq('id', id)

      if (ordineError) throw ordineError

      setOrdini(prev => prev.filter(o => o.id !== id))

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'eliminazione ordine'
      setError(message)
      return { success: false, error: message }
    }
  }

  const cambiaStato = async (id: string, nuovoStato: 'bozza' | 'confermato' | 'evaso' | 'annullato') => {
    return updateOrdine(id, { stato: nuovoStato })
  }

  useEffect(() => {
    fetchClienti()
    fetchProdotti()
    fetchOrdini()
  }, [])

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