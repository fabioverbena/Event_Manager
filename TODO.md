# 📝 TODO - EVENT MANAGER

Lista attività per completare l'MVP per la fiera di febbraio 2026.

---

## ✅ Setup Iniziale (COMPLETATO)

- [x] Struttura progetto
- [x] Schema database completo
- [x] Migration SQL
- [x] Seed categorie
- [x] Setup frontend React + TypeScript
- [x] Configurazione Tailwind CSS
- [x] Client Supabase
- [x] TypeScript types
- [x] Routing base
- [x] Layout e navigation
- [x] Documentazione database
- [x] README e guida setup

---

## 🚧 In Progress

### 1. Gestione Clienti (PRIORITÀ ALTA)

- [ ] **Lista clienti**
  - [ ] Componente tabella clienti
  - [ ] Ricerca/filtro clienti
  - [ ] Ordinamento colonne
  - [ ] Paginazione

- [ ] **Form cliente**
  - [ ] Modal/pagina nuovo cliente
  - [ ] Validazione campi (email, P.IVA, CF)
  - [ ] Gestione errori
  - [ ] Salvataggio su Supabase

- [ ] **Dettaglio cliente**
  - [ ] Vista dettaglio completa
  - [ ] Modifica dati
  - [ ] Storico ordini cliente
  - [ ] Soft delete (attivo=false)

- [ ] **Import clienti**
  - [ ] Upload CSV
  - [ ] Parsing e validazione
  - [ ] Mapping campi
  - [ ] Import batch

### 2. Gestione Prodotti (PRIORITÀ ALTA)

- [ ] **Lista prodotti**
  - [ ] Componente tabella prodotti
  - [ ] Filtro per categoria
  - [ ] Ricerca per codice/nome
  - [ ] Visualizzazione prezzo

- [ ] **Form prodotto**
  - [ ] Modal nuovo prodotto
  - [ ] Generazione automatica codice prodotto
  - [ ] Selezione categoria (dropdown gerarchico)
  - [ ] Upload immagine (Supabase Storage)
  - [ ] Validazione prezzi

- [ ] **Dettaglio prodotto**
  - [ ] Vista completa prodotto
  - [ ] Modifica dati
  - [ ] Storico vendite
  - [ ] Gestione disponibilità

- [ ] **Import prodotti**
  - [ ] Upload CSV/Excel
  - [ ] Parsing e validazione
  - [ ] Generazione automatica codici mancanti
  - [ ] Import batch

### 3. Gestione Ordini (PRIORITÀ MASSIMA)

- [ ] **Lista ordini**
  - [ ] Tabella ordini con totali
  - [ ] Filtro per stato (bozza/confermato/evaso/annullato)
  - [ ] Filtro per cliente
  - [ ] Filtro per data
  - [ ] Badge colori per stato
  - [ ] Indicatori espositori/non-espositori

- [ ] **Nuovo ordine - Step 1: Selezione cliente**
  - [ ] Ricerca cliente esistente
  - [ ] Opzione creazione rapida cliente
  - [ ] Visualizzazione dati cliente

- [ ] **Nuovo ordine - Step 2: Carrello prodotti**
  - [ ] Ricerca prodotti
  - [ ] Aggiunta al carrello
  - [ ] Modifica quantità
  - [ ] Note per riga
  - [ ] Rimozione righe
  - [ ] Calcolo subtotale automatico
  - [ ] Riordinamento righe (drag & drop?)

- [ ] **Nuovo ordine - Step 3: Sconti e totale**
  - [ ] Input sconto percentuale
  - [ ] Input sconto valore fisso
  - [ ] Visualizzazione calcolo totale
  - [ ] Note ordine
  - [ ] Salvataggio come bozza
  - [ ] Conferma ordine

- [ ] **Dettaglio ordine**
  - [ ] Vista completa ordine
  - [ ] Modifica righe
  - [ ] Cambio stato ordine
  - [ ] Storico modifiche (?)
  - [ ] Duplica ordine

- [ ] **Stampa ordine**
  - [ ] Template di stampa professionale
  - [ ] Intestazione Fior d'Acqua
  - [ ] Dettaglio righe ordinato
  - [ ] Totali e sconti
  - [ ] Note
  - [ ] CSS print-friendly
  - [ ] Anteprima stampa

- [ ] **Export ordini**
  - [ ] Export singolo ordine CSV
  - [ ] Export multiplo (selezione)
  - [ ] Export filtrato per data/cliente
  - [ ] Formato Excel (opzionale)

### 4. Dashboard (PRIORITÀ MEDIA)

- [ ] **Statistiche in tempo reale**
  - [ ] Conteggio clienti attivi
  - [ ] Conteggio prodotti disponibili
  - [ ] Conteggio ordini per stato
  - [ ] Totale fatturato (confermati + evasi)

- [ ] **Grafici (opzionale)**
  - [ ] Grafico ordini per mese
  - [ ] Top 10 prodotti venduti
  - [ ] Distribuzione espositori vs non-espositori

- [ ] **Attività recenti**
  - [ ] Ultimi ordini creati
  - [ ] Ultimi clienti aggiunti
  - [ ] Alert ordini in bozza vecchi

### 5. UX/UI (PRIORITÀ MEDIA)

- [ ] **Componenti riutilizzabili**
  - [ ] Button component
  - [ ] Input component
  - [ ] Select component
  - [ ] Modal component
  - [ ] Table component
  - [ ] Badge component
  - [ ] Loading spinner
  - [ ] Toast notifications

- [ ] **Gestione errori**
  - [ ] Error boundary
  - [ ] Messaggi errore user-friendly
  - [ ] Retry automatico richieste fallite

- [ ] **Loading states**
  - [ ] Skeleton screens
  - [ ] Loading spinners
  - [ ] Disabled states

- [ ] **Responsive design**
  - [ ] Test mobile/tablet
  - [ ] Menu mobile hamburger (?)
  - [ ] Tabelle scrollabili

### 6. Deployment (PRIORITÀ BASSA - DOPO MVP)

- [ ] **Vercel**
  - [ ] Deploy frontend
  - [ ] Configurazione env vars
  - [ ] Custom domain (opzionale)

- [ ] **Testing**
  - [ ] Test manuale completo
  - [ ] Test su diversi browser
  - [ ] Test responsive

- [ ] **Documentazione**
  - [ ] Manuale utente
  - [ ] Video tutorial (?)
  - [ ] FAQ

---

## 🔒 Security & Production (POST-FIERA)

- [ ] **Autenticazione**
  - [ ] Setup Supabase Auth
  - [ ] Login/Logout
  - [ ] Protezione route

- [ ] **Row Level Security**
  - [ ] Policy per ogni tabella
  - [ ] Test permessi

- [ ] **Backup**
  - [ ] Backup automatico DB
  - [ ] Strategia ripristino

---

## 📅 Timeline Suggerita

### Settimana 1 (3-9 Feb)
- ✅ Setup progetto (FATTO)
- 🎯 Gestione clienti completa
- 🎯 Gestione prodotti base

### Settimana 2 (10-16 Feb)
- 🎯 Gestione ordini completa
- 🎯 Stampa ordini
- 🎯 Export CSV
- 🎯 Test e bugfix

### Fiera (17-20 Feb circa)
- 🎯 Deploy produzione
- 🎯 Training team
- 🎯 Supporto in fiera

---

## 💡 Note

- Priorità massima: **ORDINI** (core business)
- Importare dati esistenti prima della fiera
- Testare stampa ordini con stampante reale
- Preparare dispositivo backup (tablet/laptop) per la fiera
- Verificare connessione internet in fiera

---

**Ultimo aggiornamento:** 2026-02-01
