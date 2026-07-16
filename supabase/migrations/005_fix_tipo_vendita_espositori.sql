-- Fix CHECK constraint su tipo_vendita_espositori
-- Il vecchio constraint ammetteva solo 'diretto' e 'leasing'
-- Il nuovo UI usa 'leasing_standard' e 'leasing_personalizzato'

-- 1. Rimuovi il vecchio constraint
ALTER TABLE ordini DROP CONSTRAINT IF EXISTS ordini_tipo_vendita_espositori_check;

-- 2. Migra i record esistenti dal valore vecchio al nuovo
UPDATE ordini SET tipo_vendita_espositori = 'leasing_standard' WHERE tipo_vendita_espositori = 'leasing';

-- 3. Aggiungi il nuovo constraint con i valori corretti
ALTER TABLE ordini ADD CONSTRAINT ordini_tipo_vendita_espositori_check
  CHECK (tipo_vendita_espositori IN ('diretto', 'leasing_standard', 'leasing_personalizzato'));
