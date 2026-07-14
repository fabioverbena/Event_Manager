-- Migration: 003_allow_negative_sconto_extra
-- Permette valori negativi su prezzo_unitario e subtotale_riga per supportare
-- il prodotto "Sconto Extra" che rappresenta uno sconto in valore assoluto.

-- Rimuove il vincolo >= 0 su prezzo_unitario (le righe sconto extra hanno prezzo negativo)
ALTER TABLE righe_ordine DROP CONSTRAINT IF EXISTS righe_ordine_prezzo_unitario_check;

-- Rimuove il vincolo >= 0 su subtotale_riga (calcolato come quantita * prezzo_unitario, può essere negativo)
ALTER TABLE righe_ordine DROP CONSTRAINT IF EXISTS righe_ordine_subtotale_riga_check;

-- Rimuove il vincolo >= 0 su subtotale ordine (somma delle righe, può essere negativa se c'è uno sconto extra grande)
ALTER TABLE ordini DROP CONSTRAINT IF EXISTS ordini_subtotale_check;

-- Nota: ordini.totale mantiene il vincolo >= 0 perché il trigger usa GREATEST(v_totale, 0),
-- quindi il totale finale non scende mai sotto zero.
