# EVENT MANAGER - Database Schema

**Fior d'Acqua - Sistema Gestione Ordini Fiere**

---

## 📊 Panoramica

Database PostgreSQL per la gestione completa di clienti, prodotti e ordini per eventi fieristici.

### Caratteristiche principali:
- ✅ **Auto-calcolo totali** ordini tramite trigger
- ✅ **Classificazione automatica** ordini (espositori/non-espositori)
- ✅ **Generazione codici prodotto** automatica
- ✅ **Gerarchia categorie** a 2 livelli
- ✅ **Snapshot prezzi** nelle righe ordine
- ✅ **Soft delete** con campo `attivo`

---

## 🗂️ Tabelle

### 1. **CLIENTI**

Anagrafica completa clienti Fior d'Acqua.

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | UUID | PK | Identificativo univoco |
| `codice_cliente_esterno` | VARCHAR(50) | nullable | Codice da sistema legacy |
| `ragione_sociale` | VARCHAR(255) | NOT NULL | Denominazione azienda |
| `nome_referente` | VARCHAR(255) | | Persona di contatto |
| `email` | VARCHAR(255) | | Email principale |
| `telefono` | VARCHAR(50) | | Telefono fisso |
| `cellulare` | VARCHAR(50) | | Telefono mobile |
| `partita_iva` | VARCHAR(20) | | P.IVA |
| `codice_fiscale` | VARCHAR(20) | | CF |
| `indirizzo` | TEXT | | Indirizzo completo |
| `citta` | VARCHAR(100) | | Città |
| `cap` | VARCHAR(10) | | CAP |
| `provincia` | VARCHAR(5) | | Sigla provincia |
| `note` | TEXT | | Note interne |
| `attivo` | BOOLEAN | DEFAULT true | Cliente attivo |
| `importato` | BOOLEAN | DEFAULT false | Dato importato |
| `created_at` | TIMESTAMP | AUTO | Data creazione |
| `updated_at` | TIMESTAMP | AUTO | Data modifica |

**Indici:**
- `idx_clienti_ragione_sociale` - Ricerca per nome
- `idx_clienti_attivo` - Filtro attivi
- `idx_clienti_email` - Ricerca email

---

### 2. **CATEGORIE**

Gerarchia a 2 livelli per classificazione prodotti.

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | UUID | PK | Identificativo univoco |
| `nome` | VARCHAR(100) | NOT NULL | Nome categoria |
| `parent_id` | UUID | FK → categorie | Categoria padre (NULL = livello 1) |
| `tipo_ordine` | VARCHAR(20) | CHECK | `espositori` o `non_espositori` |
| `ordine_visualizzazione` | INTEGER | DEFAULT 0 | Ordinamento |
| `descrizione` | TEXT | | Descrizione |
| `attivo` | BOOLEAN | DEFAULT true | Categoria attiva |
| `created_at` | TIMESTAMP | AUTO | Data creazione |

#### Struttura categorie:

```
LIVELLO 1
├─ ESPOSITORI (tipo: espositori)
└─ NON ESPOSITORI (tipo: non_espositori)

LIVELLO 2
├─ Sotto ESPOSITORI:
│  ├─ Diretti
│  └─ Leasing
│
└─ Sotto NON ESPOSITORI:
   ├─ Ricambi
   ├─ Gemme
   ├─ Nido
   ├─ Servizi
   └─ Altro
```

**Indici:**
- `idx_categorie_parent` - Ricerca sottocategorie
- `idx_categorie_tipo` - Filtro per tipo
- `idx_categorie_attivo` - Filtro attive

---

### 3. **PRODOTTI**

Catalogo prodotti con codici auto-generati.

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | UUID | PK | Identificativo univoco |
| `categoria_id` | UUID | FK → categorie | Categoria prodotto |
| `codice_prodotto` | VARCHAR(50) | UNIQUE NOT NULL | Codice interno (auto) |
| `codice_prodotto_originale` | VARCHAR(50) | nullable | Codice legacy |
| `nome` | VARCHAR(255) | NOT NULL | Nome prodotto |
| `descrizione` | TEXT | | Descrizione estesa |
| `prezzo_listino` | DECIMAL(10,2) | >= 0 | Prezzo imponibile €/unità |
| `unita_misura` | VARCHAR(20) | DEFAULT 'pz' | Unità (pz, set, ml, kg) |
| `disponibile` | BOOLEAN | DEFAULT true | Prodotto disponibile |
| `note` | TEXT | | Note interne |
| `immagine_url` | TEXT | | URL immagine prodotto |
| `importato` | BOOLEAN | DEFAULT false | Dato importato |
| `created_at` | TIMESTAMP | AUTO | Data creazione |
| `updated_at` | TIMESTAMP | AUTO | Data modifica |

#### Generazione automatica `codice_prodotto`:

```sql
-- Esempi:
"Espositore Refrigerato" → "ESRE-001"
"Ricambio Termostato" → "RITE-001"
"Gemme Decorative" → "GEDE-001"

-- Funzione:
SELECT genera_codice_prodotto('Nome Prodotto');
```

**Indici:**
- `idx_prodotti_categoria` - Filtro per categoria
- `idx_prodotti_codice` - Ricerca codice
- `idx_prodotti_disponibile` - Filtro disponibili
- `idx_prodotti_nome` - Full-text search (italiano)

---

### 4. **ORDINI**

Testata ordini con calcolo automatico totali e classificazione.

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | UUID | PK | Identificativo univoco |
| `numero_ordine` | SERIAL | UNIQUE | Progressivo ordine (1, 2, 3...) |
| `cliente_id` | UUID | FK → clienti | Cliente |
| `ha_espositori` | BOOLEAN | AUTO | Contiene espositori (calc) |
| `ha_altri_prodotti` | BOOLEAN | AUTO | Contiene non-espositori (calc) |
| `data_ordine` | DATE | DEFAULT today | Data ordine |
| `stato` | VARCHAR(20) | CHECK | bozza/confermato/evaso/annullato |
| `subtotale` | DECIMAL(10,2) | AUTO >= 0 | Totale righe (calc) |
| `sconto_percentuale` | DECIMAL(5,2) | 0-100 | Sconto % su totale |
| `sconto_valore` | DECIMAL(10,2) | >= 0 | Sconto € fisso |
| `totale` | DECIMAL(10,2) | AUTO >= 0 | Totale finale (calc) |
| `note` | TEXT | | Note ordine |
| `created_by` | VARCHAR(100) | | Operatore |
| `created_at` | TIMESTAMP | AUTO | Data creazione |
| `updated_at` | TIMESTAMP | AUTO | Data modifica |

#### Calcolo automatico:

```javascript
subtotale = SUM(righe.subtotale_riga)
totale = subtotale

if (sconto_percentuale) {
  totale = totale * (1 - sconto_percentuale / 100)
}

if (sconto_valore) {
  totale = totale - sconto_valore
}

totale = MAX(totale, 0) // Non negativo
```

**Indici:**
- `idx_ordini_cliente` - Ordini per cliente
- `idx_ordini_stato` - Filtro per stato
- `idx_ordini_data` - Ordinamento cronologico
- `idx_ordini_numero` - Ricerca numero ordine

---

### 5. **RIGHE_ORDINE**

Dettaglio prodotti per ogni ordine con snapshot prezzi.

| Campo | Tipo | Vincoli | Descrizione |
|-------|------|---------|-------------|
| `id` | UUID | PK | Identificativo univoco |
| `ordine_id` | UUID | FK → ordini | Ordine di riferimento |
| `prodotto_id` | UUID | FK → prodotti | Prodotto ordinato |
| `quantita` | DECIMAL(10,2) | > 0 | Quantità |
| `prezzo_unitario` | DECIMAL(10,2) | >= 0 | Prezzo €/unità (snapshot) |
| `subtotale_riga` | DECIMAL(10,2) | AUTO >= 0 | quantità × prezzo (calc) |
| `note_riga` | TEXT | | Note specifiche riga |
| `ordine_riga` | INTEGER | DEFAULT 0 | Ordinamento visualizzazione |

#### Calcolo automatico:

```sql
-- Trigger automatico:
subtotale_riga = quantita * prezzo_unitario
```

**Indici:**
- `idx_righe_ordine` - Righe per ordine
- `idx_righe_prodotto` - Prodotti ordinati
- `idx_righe_ordine_riga` - Ordinamento righe

---

## ⚙️ Trigger Automatici

### 1. **Updated_at**
Aggiorna automaticamente `updated_at` su modifiche:
- `clienti`
- `prodotti`
- `ordini`

### 2. **Calcolo subtotale_riga**
```sql
-- Su INSERT/UPDATE di righe_ordine
subtotale_riga = quantita * prezzo_unitario
```

### 3. **Ricalcolo totali ordine**
```sql
-- Su INSERT/UPDATE/DELETE di righe_ordine
subtotale = SUM(righe.subtotale_riga)
totale = applica_sconti(subtotale)
```

### 4. **Ricalcolo flag ordini**
```sql
-- Su INSERT/UPDATE/DELETE di righe_ordine
ha_espositori = righe.some(r => tipo_ordine === 'espositori')
ha_altri_prodotti = righe.some(r => tipo_ordine === 'non_espositori')
```

### 5. **Ricalcolo su cambio sconti**
```sql
-- Su UPDATE di ordini.sconto_percentuale o sconto_valore
totale = ricalcola_con_nuovi_sconti()
```

---

## 🔧 Funzioni Utility

### `genera_codice_prodotto(nome_prodotto)`

Genera codice automatico formato `XXXX-NNN`:

```sql
SELECT genera_codice_prodotto('Espositore Refrigerato Verticale');
-- Output: "ESRE-001"

SELECT genera_codice_prodotto('Ricambio Termostato Digitale');
-- Output: "RITE-001"
```

**Logica:**
1. Estrai prime 2 parole significative (>2 caratteri)
2. Prendi prime 2 lettere di ogni parola → 4 lettere
3. Trova prossimo progressivo per quel prefisso
4. Formato: `[PREFISSO]-[PROGR]`

### `get_prodotto_tipo_ordine(prodotto_id)`

Recupera il `tipo_ordine` di un prodotto:

```sql
SELECT get_prodotto_tipo_ordine('uuid-prodotto');
-- Output: "espositori" o "non_espositori"
```

---

## 📝 Query Comuni

### Clienti attivi
```sql
SELECT * FROM clienti 
WHERE attivo = true
ORDER BY ragione_sociale;
```

### Albero categorie completo
```sql
SELECT 
  CASE WHEN c.parent_id IS NULL THEN '📁 ' ELSE '  └─ ' END || c.nome as categoria,
  c.tipo_ordine,
  c.attivo
FROM categorie c
LEFT JOIN categorie parent ON c.parent_id = parent.id
ORDER BY 
  COALESCE(parent.ordine_visualizzazione, c.ordine_visualizzazione),
  c.ordine_visualizzazione;
```

### Prodotti disponibili per categoria
```sql
SELECT 
  p.codice_prodotto,
  p.nome,
  p.prezzo_listino,
  c.nome as categoria
FROM prodotti p
JOIN categorie c ON p.categoria_id = c.id
WHERE p.disponibile = true AND p.attivo = true
ORDER BY c.nome, p.nome;
```

### Ordini in bozza con totali
```sql
SELECT 
  o.numero_ordine,
  c.ragione_sociale,
  o.data_ordine,
  o.subtotale,
  o.totale,
  o.ha_espositori,
  o.ha_altri_prodotti,
  COUNT(r.id) as num_righe
FROM ordini o
JOIN clienti c ON o.cliente_id = c.id
LEFT JOIN righe_ordine r ON o.id = r.ordine_id
WHERE o.stato = 'bozza'
GROUP BY o.id, c.ragione_sociale
ORDER BY o.numero_ordine DESC;
```

### Dettaglio completo ordine
```sql
SELECT 
  o.numero_ordine,
  c.ragione_sociale,
  p.codice_prodotto,
  p.nome as prodotto,
  r.quantita,
  r.prezzo_unitario,
  r.subtotale_riga,
  cat.nome as categoria
FROM ordini o
JOIN clienti c ON o.cliente_id = c.id
JOIN righe_ordine r ON o.id = r.ordine_id
JOIN prodotti p ON r.prodotto_id = p.id
JOIN categorie cat ON p.categoria_id = cat.id
WHERE o.numero_ordine = 1
ORDER BY r.ordine_riga;
```

### Prodotti più ordinati
```sql
SELECT 
  p.codice_prodotto,
  p.nome,
  COUNT(r.id) as num_ordini,
  SUM(r.quantita) as totale_quantita,
  SUM(r.subtotale_riga) as fatturato_totale
FROM prodotti p
JOIN righe_ordine r ON p.id = r.prodotto_id
JOIN ordini o ON r.ordine_id = o.id
WHERE o.stato IN ('confermato', 'evaso')
GROUP BY p.id, p.codice_prodotto, p.nome
ORDER BY totale_quantita DESC
LIMIT 10;
```

---

## 🔐 Row Level Security (RLS)

**Da configurare in Supabase:**

```sql
-- Esempio policy base (da personalizzare)
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE prodotti ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE righe_ordine ENABLE ROW LEVEL SECURITY;

-- Policy esempio: tutti possono leggere, solo autenticati possono scrivere
CREATE POLICY "Public read access" ON clienti FOR SELECT USING (true);
CREATE POLICY "Authenticated write access" ON clienti FOR ALL USING (auth.role() = 'authenticated');
```

---

## 📦 Deployment

### Supabase CLI

```bash
# Applica migrations
supabase db push

# Reset completo (ATTENZIONE: cancella dati!)
supabase db reset

# Genera types TypeScript
supabase gen types typescript --local > src/types/database.types.ts
```

---

## 🔄 Versioning

| Versione | Data | Descrizione |
|----------|------|-------------|
| 1.0 | 2026-02-01 | Schema iniziale completo |

---

## 📧 Contatti

**Progetto:** EVENT MANAGER  
**Cliente:** Fior d'Acqua - Leonardo Zanotti  
**Sviluppatore:** Fabio
