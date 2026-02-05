import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Prodotto = Database['public']['Tables']['prodotti']['Row']
type ProdottoInsert = Database['public']['Tables']['prodotti']['Insert']
type ProdottoUpdate = Database['public']['Tables']['prodotti']['Update']
type Categoria = Database['public']['Tables']['categorie']['Row']

export function useProdotti() {
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategorie = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categorie')
        .select('*')
        .eq('attivo', true)
        .order('ordine_visualizzazione', { ascending: true })

      if (fetchError) throw fetchError
      setCategorie(data || [])
    } catch (err) {
      console.error('Errore fetch categorie:', err)
    }
  }

  const fetchProdotti = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('prodotti')
        .select('*, categorie(nome, parent_id)')
        .eq('disponibile', true)
        .order('codice_prodotto', { ascending: true })

      if (fetchError) throw fetchError

      setProdotti(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento prodotti')
      console.error('Errore fetch prodotti:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateCodiceProdotto = async (nomeProdotto: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('genera_codice_prodotto', { p_nome_prodotto: nomeProdotto })

      if (error) throw error
      return data || 'PROD-001'
    } catch (err) {
      console.error('Errore generazione codice:', err)
      return 'PROD-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    }
  }

  const createProdotto = async (prodotto: ProdottoInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('prodotti')
        .insert(prodotto)
        .select('*, categorie(nome, parent_id)')
        .single()

      if (insertError) throw insertError

      setProdotti(prev => [...prev, data].sort((a, b) => 
        a.codice_prodotto.localeCompare(b.codice_prodotto)
      ))

      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nella creazione prodotto'
      setError(message)
      return { success: false, error: message }
    }
  }

  const updateProdotto = async (id: string, updates: ProdottoUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('prodotti')
        .update(updates)
        .eq('id', id)
        .select('*, categorie(nome, parent_id)')
        .single()

      if (updateError) throw updateError

      setProdotti(prev => 
        prev.map(p => p.id === id ? data : p)
          .sort((a, b) => a.codice_prodotto.localeCompare(b.codice_prodotto))
      )

      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'aggiornamento prodotto'
      setError(message)
      return { success: false, error: message }
    }
  }

  const deleteProdotto = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('prodotti')
        .update({ disponibile: false })
        .eq('id', id)

      if (deleteError) throw deleteError

      setProdotti(prev => prev.filter(p => p.id !== id))

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'eliminazione prodotto'
      setError(message)
      return { success: false, error: message }
    }
  }

  const searchProdotti = async (query: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: searchError } = await supabase
        .from('prodotti')
        .select('*, categorie(nome, parent_id)')
        .eq('disponibile', true)
        .or(`nome.ilike.%${query}%,codice_prodotto.ilike.%${query}%`)
        .order('codice_prodotto', { ascending: true })

      if (searchError) throw searchError

      setProdotti(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca')
      console.error('Errore search prodotti:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorie()
    fetchProdotti()
  }, [])

  return {
    prodotti,
    categorie,
    loading,
    error,
    fetchProdotti,
    createProdotto,
    updateProdotto,
    deleteProdotto,
    searchProdotti,
    generateCodiceProdotto,
  }
}