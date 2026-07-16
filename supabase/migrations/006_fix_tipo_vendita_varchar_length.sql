-- Fix: tipo_vendita_espositori era VARCHAR(20), ma 'leasing_personalizzato' è 22 caratteri
-- Allargo la colonna a VARCHAR(30) per sicurezza
ALTER TABLE ordini ALTER COLUMN tipo_vendita_espositori TYPE VARCHAR(30);
