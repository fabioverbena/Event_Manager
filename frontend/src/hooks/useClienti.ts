import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Cliente = Database['public']['Tables']['clienti']['Row']
type ClienteInsert = Database['public']['Tables']['clienti']['Insert']
type ClienteUpdate = Database['public']['Tables']['clienti']['Update']

export function useClienti() {
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClienti = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('clienti')
        .select('*')
        .eq('attivo', true)
        .order('ragione_sociale', { ascending: true })

      if (fetchError) throw fetchError

      setClienti(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento clienti')
      console.error('Errore fetch clienti:', err)
    } finally {
      setLoading(false)
    }
  }

  const createCliente = async (cliente: ClienteInsert) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clienti')
        .insert(cliente)
        .select()
        .single()

      if (insertError) throw insertError

      setClienti(prev => [...prev, data].sort((a, b) => 
        a.ragione_sociale.localeCompare(b.ragione_sociale)
      ))

      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nella creazione cliente'
      setError(message)
      return { success: false, error: message }
    }
  }

  const updateCliente = async (id: string, updates: ClienteUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('clienti')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      setClienti(prev => 
        prev.map(c => c.id === id ? data : c)
          .sort((a, b) => a.ragione_sociale.localeCompare(b.ragione_sociale))
      )

      return { success: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'aggiornamento cliente'
      setError(message)
      return { success: false, error: message }
    }
  }

  const deleteCliente = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clienti')
        .update({ attivo: false })
        .eq('id', id)

      if (deleteError) throw deleteError

      setClienti(prev => prev.filter(c => c.id !== id))

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nell\'eliminazione cliente'
      setError(message)
      return { success: false, error: message }
    }
  }

  const searchClienti = async (query: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: searchError } = await supabase
        .from('clienti')
        .select('*')
        .eq('attivo', true)
        .ilike('ragione_sociale', `%${query}%`)
        .order('ragione_sociale', { ascending: true })

      if (searchError) throw searchError

      setClienti(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca')
      console.error('Errore search clienti:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClienti()
  }, [])

  return {
    clienti,
    loading,
    error,
    fetchClienti,
    createCliente,
    updateCliente,
    deleteCliente,
    searchClienti,
  }
}