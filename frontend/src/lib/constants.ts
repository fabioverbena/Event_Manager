export const APP_NAME = 'EVENT MANAGER'
export const APP_VERSION = '1.0.0'
export const COMPANY_NAME = 'Fior d\'Acqua'

export const STATO_ORDINE = {
  BOZZA: 'bozza',
  CONFERMATO: 'confermato',
  EVASO: 'evaso',
  ANNULLATO: 'annullato',
} as const

export const STATO_ORDINE_LABELS = {
  bozza: 'Bozza',
  confermato: 'Confermato',
  evaso: 'Evaso',
  annullato: 'Annullato',
} as const

export const TIPO_ORDINE = {
  ESPOSITORI: 'espositori',
  NON_ESPOSITORI: 'non_espositori',
} as const

export const UNITA_MISURA = [
  { value: 'pz', label: 'Pezzo' },
  { value: 'set', label: 'Set' },
  { value: 'ml', label: 'Metro Lineare' },
  { value: 'kg', label: 'Kilogrammo' },
  { value: 'lt', label: 'Litro' },
  { value: 'mq', label: 'Metro Quadrato' },
  { value: 'ore', label: 'Ore' },
] as const

export const CATEGORIE_IDS = {
  ESPOSITORI: 'c1000000-0000-0000-0000-000000000001',
  NON_ESPOSITORI: 'c2000000-0000-0000-0000-000000000002',
  DIRETTI: 'c1100000-0000-0000-0000-000000000011',
  LEASING: 'c1200000-0000-0000-0000-000000000012',
  RICAMBI: 'c2100000-0000-0000-0000-000000000021',
  GEMME: 'c2200000-0000-0000-0000-000000000022',
  NIDO: 'c2300000-0000-0000-0000-000000000023',
  SERVIZI: 'c2400000-0000-0000-0000-000000000024',
  ALTRO: 'c2500000-0000-0000-0000-000000000025',
} as const

export const PROVINCE_ITALIANE = [
  'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ',
  'BS', 'BR', 'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN',
  'FM', 'FE', 'FI', 'FG', 'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC',
  'LI', 'LO', 'LU', 'MC', 'MN', 'MS', 'MT', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OT', 'OR',
  'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC', 'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC',
  'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'VS', 'SS', 'SV', 'SI', 'SR', 'SO', 'TA', 'TE', 'TR', 'TO',
  'OG', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV', 'VI', 'VT',
] as const

export const LIMITS = {
  MAX_SCONTO_PERCENTUALE: 100,
  MIN_SCONTO_PERCENTUALE: 0,
  MAX_QUANTITA: 9999.99,
  MIN_QUANTITA: 0.01,
  MAX_PREZZO: 999999.99,
  MIN_PREZZO: 0,
} as const

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Questo campo è obbligatorio',
  INVALID_EMAIL: 'Email non valida',
  INVALID_PARTITA_IVA: 'Partita IVA non valida (11 cifre)',
  INVALID_CODICE_FISCALE: 'Codice Fiscale non valido',
  GENERIC_ERROR: 'Si è verificato un errore. Riprova.',
  NETWORK_ERROR: 'Errore di connessione. Controlla la rete.',
} as const

export const SUCCESS_MESSAGES = {
  CLIENTE_CREATED: 'Cliente creato con successo',
  CLIENTE_UPDATED: 'Cliente aggiornato con successo',
  CLIENTE_DELETED: 'Cliente eliminato con successo',
  PRODOTTO_CREATED: 'Prodotto creato con successo',
  PRODOTTO_UPDATED: 'Prodotto aggiornato con successo',
  PRODOTTO_DELETED: 'Prodotto eliminato con successo',
  ORDINE_CREATED: 'Ordine creato con successo',
  ORDINE_UPDATED: 'Ordine aggiornato con successo',
  ORDINE_DELETED: 'Ordine eliminato con successo',
} as const