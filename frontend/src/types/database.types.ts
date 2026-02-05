export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clienti: {
        Row: {
          id: string
          codice_cliente_esterno: string | null
          ragione_sociale: string
          nome_referente: string | null
          email: string | null
          telefono: string | null
          cellulare: string | null
          partita_iva: string | null
          codice_fiscale: string | null
          indirizzo: string | null
          citta: string | null
          cap: string | null
          provincia: string | null
          note: string | null
          attivo: boolean
          importato: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codice_cliente_esterno?: string | null
          ragione_sociale: string
          nome_referente?: string | null
          email?: string | null
          telefono?: string | null
          cellulare?: string | null
          partita_iva?: string | null
          codice_fiscale?: string | null
          indirizzo?: string | null
          citta?: string | null
          cap?: string | null
          provincia?: string | null
          note?: string | null
          attivo?: boolean
          importato?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codice_cliente_esterno?: string | null
          ragione_sociale?: string
          nome_referente?: string | null
          email?: string | null
          telefono?: string | null
          cellulare?: string | null
          partita_iva?: string | null
          codice_fiscale?: string | null
          indirizzo?: string | null
          citta?: string | null
          cap?: string | null
          provincia?: string | null
          note?: string | null
          attivo?: boolean
          importato?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categorie: {
        Row: {
          id: string
          nome: string
          parent_id: string | null
          tipo_ordine: 'espositori' | 'non_espositori'
          ordine_visualizzazione: number
          descrizione: string | null
          attivo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          parent_id?: string | null
          tipo_ordine: 'espositori' | 'non_espositori'
          ordine_visualizzazione?: number
          descrizione?: string | null
          attivo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          parent_id?: string | null
          tipo_ordine?: 'espositori' | 'non_espositori'
          ordine_visualizzazione?: number
          descrizione?: string | null
          attivo?: boolean
          created_at?: string
        }
      }
      prodotti: {
        Row: {
          id: string
          categoria_id: string
          codice_prodotto: string
          codice_prodotto_originale: string | null
          nome: string
          descrizione: string | null
          prezzo_listino: number
          unita_misura: string
          disponibile: boolean
          note: string | null
          immagine_url: string | null
          importato: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          categoria_id: string
          codice_prodotto: string
          codice_prodotto_originale?: string | null
          nome: string
          descrizione?: string | null
          prezzo_listino: number
          unita_misura?: string
          disponibile?: boolean
          note?: string | null
          immagine_url?: string | null
          importato?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          categoria_id?: string
          codice_prodotto?: string
          codice_prodotto_originale?: string | null
          nome?: string
          descrizione?: string | null
          prezzo_listino?: number
          unita_misura?: string
          disponibile?: boolean
          note?: string | null
          immagine_url?: string | null
          importato?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ordini: {
        Row: {
          id: string
          numero_ordine: number
          cliente_id: string
          ha_espositori: boolean
          ha_altri_prodotti: boolean
          data_ordine: string
          stato: 'bozza' | 'confermato' | 'evaso' | 'annullato'
          subtotale: number
          sconto_percentuale: number | null
          sconto_valore: number | null
          totale: number
          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_ordine?: number
          cliente_id: string
          ha_espositori?: boolean
          ha_altri_prodotti?: boolean
          data_ordine?: string
          stato?: 'bozza' | 'confermato' | 'evaso' | 'annullato'
          subtotale?: number
          sconto_percentuale?: number | null
          sconto_valore?: number | null
          totale?: number
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_ordine?: number
          cliente_id?: string
          ha_espositori?: boolean
          ha_altri_prodotti?: boolean
          data_ordine?: string
          stato?: 'bozza' | 'confermato' | 'evaso' | 'annullato'
          subtotale?: number
          sconto_percentuale?: number | null
          sconto_valore?: number | null
          totale?: number
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      righe_ordine: {
        Row: {
          id: string
          ordine_id: string
          prodotto_id: string
          quantita: number
          prezzo_unitario: number
          subtotale_riga: number
          note_riga: string | null
          ordine_riga: number
        }
        Insert: {
          id?: string
          ordine_id: string
          prodotto_id: string
          quantita: number
          prezzo_unitario: number
          subtotale_riga?: number
          note_riga?: string | null
          ordine_riga?: number
        }
        Update: {
          id?: string
          ordine_id?: string
          prodotto_id?: string
          quantita?: number
          prezzo_unitario?: number
          subtotale_riga?: number
          note_riga?: string | null
          ordine_riga?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      genera_codice_prodotto: {
        Args: { p_nome_prodotto: string }
        Returns: string
      }
      get_prodotto_tipo_ordine: {
        Args: { p_prodotto_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}