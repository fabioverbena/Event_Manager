# 🚀 Setup Supabase - Guida Passo-Passo

Questa guida ti aiuterà a configurare il database PostgreSQL per EVENT MANAGER usando Supabase.

---

## 📋 Prerequisiti

- Account Google o GitHub (per login Supabase)
- Browser web moderno

---

## 1️⃣ Crea Account Supabase

1. Vai su [https://supabase.com](https://supabase.com)
2. Clicca su **"Start your project"**
3. Accedi con Google o GitHub
4. Conferma la tua email

---

## 2️⃣ Crea Nuovo Progetto

1. Nel dashboard, clicca su **"New project"**
2. Compila i campi:
   - **Organization**: Seleziona o crea una nuova organization
   - **Name**: `event-manager-fda` (o nome a tua scelta)
   - **Database Password**: Genera una password sicura (SALVALA!)
   - **Region**: Seleziona `Europe West (Ireland)` (più vicino all'Italia)
   - **Pricing Plan**: Seleziona **Free** (sufficiente per iniziare)
3. Clicca su **"Create new project"**
4. Attendi 1-2 minuti per la creazione del database

---

## 3️⃣ Ottieni le Credenziali

1. Nel menu laterale, vai su **Settings** (icona ingranaggio)
2. Clicca su **API**
3. Copia i seguenti valori:

   ```
   Project URL: https://xxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **SALVA QUESTI VALORI** - ti serviranno dopo!

---

## 4️⃣ Esegui le Migration SQL

### Opzione A: SQL Editor (consigliato per iniziare)

1. Nel menu laterale, clicca su **SQL Editor**
2. Clicca su **"New query"**
3. Copia il contenuto di `supabase/migrations/001_initial_schema.sql`
4. Incollalo nell'editor SQL
5. Clicca su **"Run"** (o `Ctrl/Cmd + Enter`)
6. Attendi il messaggio di successo

7. Ripeti per `supabase/migrations/002_seed_categories.sql`:
   - Crea nuova query
   - Copia e incolla il contenuto
   - Run

### Opzione B: Supabase CLI (per utenti avanzati)

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref your-project-ref

# Push migration
supabase db push
```

---

## 5️⃣ Verifica Database

1. Nel menu laterale, clicca su **Table Editor**
2. Dovresti vedere 5 tabelle:
   - ✅ clienti
   - ✅ categorie
   - ✅ prodotti
   - ✅ ordini
   - ✅ righe_ordine

3. Clicca su **categorie**
4. Dovresti vedere 9 righe (2 categorie principali + 7 sottocategorie)

---

## 6️⃣ Configura l'App Frontend

1. Apri il progetto `fiere-ordini-app/frontend`
2. Copia `.env.example` in `.env`:

   ```bash
   cp .env.example .env
   ```

3. Modifica il file `.env` con le credenziali salvate al punto 3:

   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Salva il file

---

## 7️⃣ Avvia l'App

```bash
# Dalla cartella frontend
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

Se vedi il dashboard senza errori, **sei pronto! 🎉**

---

## 🔐 (Opzionale) Configura Row Level Security

**IMPORTANTE:** Per ora l'app è accessibile a tutti. Per produzione, configura le policy RLS.

1. Nel dashboard Supabase, vai su **Authentication** → **Policies**
2. Per ogni tabella, abilita RLS e crea policy appropriate

Esempio policy base:

```sql
-- Abilita RLS
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere
CREATE POLICY "Public read access" 
ON clienti FOR SELECT 
USING (true);

-- Policy: solo utenti autenticati possono scrivere
CREATE POLICY "Authenticated write access" 
ON clienti FOR ALL 
USING (auth.role() = 'authenticated');
```

---

## 🆘 Troubleshooting

### Errore: "relation does not exist"
- Verifica di aver eseguito tutte le migration
- Controlla che non ci siano errori SQL nell'editor

### Errore: "Invalid API key"
- Ricontrolla che hai copiato correttamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Assicurati di usare la **anon public key** (non la service_role key!)

### L'app non si connette
- Verifica che il file `.env` sia nella cartella `frontend/`
- Riavvia il server di sviluppo (`npm run dev`)
- Controlla la console del browser per errori

### Query troppo lente
- Piano gratuito Supabase ha limiti di performance
- Considera upgrade a piano Pro se necessario

---

## 📚 Risorse Utili

- [Documentazione Supabase](https://supabase.com/docs)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎯 Prossimi Passi

Ora che il database è pronto, puoi:

1. ✅ Creare i primi clienti
2. ✅ Aggiungere prodotti al catalogo
3. ✅ Testare la creazione di ordini
4. ✅ Preparare dati per la fiera di febbraio

**Buon lavoro! 🚀**
