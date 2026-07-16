# 🎯 EVENT MANAGER - Fior d'Acqua

Sistema di gestione ordini per fiere ed eventi - **Fior d'Acqua**

---

## 📋 Panoramica

**EVENT MANAGER** è un'applicazione web per la gestione completa di:
- ✅ Anagrafica clienti
- ✅ Catalogo prodotti (espositori, ricambi, accessori)
- ✅ Ordini con calcolo automatico totali
- ✅ Export CSV per stampa e analisi

### Caratteristiche principali:
- 🔄 **Calcolo automatico** di subtotali e totali ordini
- 📊 **Classificazione automatica** ordini (espositori/non-espositori)
- 🔢 **Generazione codici prodotto** automatica
- 📱 **Responsive design** per uso in fiera
- 💾 **Database PostgreSQL** con Supabase

---

## 🚀 Quick Start

### Prerequisiti

- Node.js 18+ e npm
- Account Supabase (gratuito)
- Git

### 1. Clone del repository

```bash
git clone <repository-url>
cd fiere-ordini-app
```

### 2. Setup Database (Supabase)

1. Vai su [https://supabase.com](https://supabase.com) e crea un nuovo progetto
2. Copia le credenziali (URL e anon key)
3. Esegui le migration SQL:

```bash
# Nel dashboard Supabase, vai su SQL Editor
# Esegui in ordine:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_categories.sql
```

**Oppure usa Supabase CLI:**

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Setup Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Copia .env.example in .env
cp .env.example .env

# Modifica .env con le tue credenziali Supabase
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Avvio in sviluppo

```bash
# Dalla cartella frontend
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

---

## 📂 Struttura Progetto

```
fiere-ordini-app/
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/    # Componenti riutilizzabili
│   │   ├── pages/         # Pagine dell'app
│   │   ├── lib/           # Utilities (Supabase client)
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── supabase/              # Database
│   ├── migrations/        # Migration SQL
│   └── schema.sql         # Schema completo
│
└── docs/                  # Documentazione
    └── database-schema.md
```

---

## 🗄️ Database Schema

### Tabelle principali:

1. **clienti** - Anagrafica completa
2. **categorie** - Gerarchia 2 livelli (ESPOSITORI → Diretti/Leasing, NON ESPOSITORI → Ricambi/Gemme/Nido/Servizi/Altro)
3. **prodotti** - Catalogo con codici auto-generati
4. **ordini** - Testata ordini con calcoli automatici
5. **righe_ordine** - Dettaglio prodotti per ordine

Vedi [docs/database-schema.md](./docs/database-schema.md) per dettagli completi.

---

## 🔧 Script Disponibili

### Frontend

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview

# Type checking
npm run type-check

# Lint
npm run lint

# Genera types da Supabase
npm run generate-types
```

---

## 🎨 Stack Tecnologico

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **React Router** (routing)
- **Tailwind CSS** (styling)
- **Lucide React** (icons)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **PostgreSQL** con trigger automatici

### Deployment
- Frontend: **Vercel** (consigliato)
- Database: **Supabase Cloud**

---

## 📝 Funzionalità MVP (Fiera Febbraio 2026)

- [x] Setup progetto completo
- [ ] CRUD Clienti (create, read, update, delete)
- [ ] CRUD Prodotti con generazione codici
- [ ] CRUD Ordini con carrello prodotti
- [ ] Calcolo automatico totali e sconti
- [ ] Stampa ordini (print CSS)
- [ ] Export CSV ordini

---

## 🔐 Autenticazione

**TODO:** Configurare Row Level Security (RLS) in Supabase per proteggere i dati.

Per ora l'app è accessibile senza autenticazione (solo per sviluppo/fiera).

---

## 🚢 Deployment

### Vercel (consigliato)

```bash
# Dalla cartella frontend
npm run build

# Deploy su Vercel
npx vercel --prod
```

**Variabili d'ambiente da configurare su Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📚 Documentazione

- [Database Schema](./docs/database-schema.md) - Schema completo con esempi query

---

## 🤝 Supporto

**Progetto:** EVENT MANAGER  
**Cliente:** Fior d'Acqua - Leonardo Zanotti  
**Sviluppatore:** Fabio

---

## 📄 Licenza

Proprietario - Fior d'Acqua © 2026
