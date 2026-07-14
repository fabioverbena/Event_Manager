-- Migration: 002_seed_categories
-- Created: 2026-02-01
-- Description: Popolamento categorie iniziali per EVENT MANAGER

INSERT INTO categorie (id, nome, parent_id, tipo_ordine, ordine_visualizzazione, descrizione, attivo)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'ESPOSITORI',
    NULL,
    'espositori',
    1,
    'Espositori refrigerati per fiori recisi - vendita diretta e leasing',
    true
  ),
  (
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'NON ESPOSITORI',
    NULL,
    'non_espositori',
    2,
    'Ricambi, accessori, servizi e altri prodotti',
    true
  );

INSERT INTO categorie (id, nome, parent_id, tipo_ordine, ordine_visualizzazione, descrizione, attivo)
VALUES
  (
    'c1100000-0000-0000-0000-000000000011'::uuid,
    'Diretti',
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'espositori',
    1,
    'Espositori venduti direttamente al cliente',
    true
  ),
  (
    'c1200000-0000-0000-0000-000000000012'::uuid,
    'Leasing',
    'c1000000-0000-0000-0000-000000000001'::uuid,
    'espositori',
    2,
    'Espositori forniti in leasing operativo',
    true
  );

INSERT INTO categorie (id, nome, parent_id, tipo_ordine, ordine_visualizzazione, descrizione, attivo)
VALUES
  (
    'c2100000-0000-0000-0000-000000000021'::uuid,
    'Ricambi',
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'non_espositori',
    1,
    'Ricambi e componenti per espositori (motori, resistenze, schede, ecc.)',
    true
  ),
  (
    'c2200000-0000-0000-0000-000000000022'::uuid,
    'Gemme',
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'non_espositori',
    2,
    'Gemme decorative e accessori luminosi',
    true
  ),
  (
    'c2300000-0000-0000-0000-000000000023'::uuid,
    'Nido',
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'non_espositori',
    3,
    'Sistema Nido di protezione e supporto',
    true
  ),
  (
    'c2400000-0000-0000-0000-000000000024'::uuid,
    'Servizi',
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'non_espositori',
    4,
    'Servizi di manutenzione, assistenza e consulenza',
    true
  ),
  (
    'c2500000-0000-0000-0000-000000000025'::uuid,
    'Altro',
    'c2000000-0000-0000-0000-000000000002'::uuid,
    'non_espositori',
    5,
    'Altri prodotti e accessori non classificati',
    true
  );
