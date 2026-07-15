-- Migration: 004_disable_rls
-- Disabilita RLS su tutte le tabelle: l'app usa Firebase per l'autenticazione
-- e la chiave anon di Supabase per tutti gli accessi al DB.
-- Senza questa migration, UPDATE e DELETE falliscono silenziosamente.

ALTER TABLE clienti DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorie DISABLE ROW LEVEL SECURITY;
ALTER TABLE prodotti DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordini DISABLE ROW LEVEL SECURITY;
ALTER TABLE righe_ordine DISABLE ROW LEVEL SECURITY;

-- Rimuove eventuali policy esistenti che bloccano le operazioni
DROP POLICY IF EXISTS "Enable read access for all users" ON clienti;
DROP POLICY IF EXISTS "Enable read access for all users" ON categorie;
DROP POLICY IF EXISTS "Enable read access for all users" ON prodotti;
DROP POLICY IF EXISTS "Enable read access for all users" ON ordini;
DROP POLICY IF EXISTS "Enable read access for all users" ON righe_ordine;
