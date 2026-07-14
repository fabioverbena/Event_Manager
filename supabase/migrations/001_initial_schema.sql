-- Migration: 001_initial_schema
-- Created: 2026-02-01
-- Description: Schema iniziale EVENT MANAGER con tutte le tabelle

-- Abilita estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: CLIENTI
-- =====================================================
CREATE TABLE clienti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codice_cliente_esterno VARCHAR(50),
  ragione_sociale VARCHAR(255) NOT NULL,
  nome_referente VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  cellulare VARCHAR(50),
  partita_iva VARCHAR(20),
  codice_fiscale VARCHAR(20),
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(5),
  note TEXT,
  attivo BOOLEAN DEFAULT true,
  importato BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clienti_ragione_sociale ON clienti(ragione_sociale);
CREATE INDEX idx_clienti_attivo ON clienti(attivo);
CREATE INDEX idx_clienti_email ON clienti(email);

-- =====================================================
-- TABELLA: CATEGORIE
-- =====================================================
CREATE TABLE categorie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categorie(id) ON DELETE CASCADE,
  tipo_ordine VARCHAR(20) NOT NULL CHECK (tipo_ordine IN ('espositori', 'non_espositori')),
  ordine_visualizzazione INTEGER DEFAULT 0,
  descrizione TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categorie_parent ON categorie(parent_id);
CREATE INDEX idx_categorie_tipo ON categorie(tipo_ordine);
CREATE INDEX idx_categorie_attivo ON categorie(attivo);

-- =====================================================
-- TABELLA: PRODOTTI
-- =====================================================
CREATE TABLE prodotti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL REFERENCES categorie(id),
  codice_prodotto VARCHAR(50) UNIQUE NOT NULL,
  codice_prodotto_originale VARCHAR(50),
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  prezzo_listino DECIMAL(10,2) NOT NULL CHECK (prezzo_listino >= 0),
  unita_misura VARCHAR(20) DEFAULT 'pz',
  disponibile BOOLEAN DEFAULT true,
  note TEXT,
  immagine_url TEXT,
  importato BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prodotti_categoria ON prodotti(categoria_id);
CREATE INDEX idx_prodotti_codice ON prodotti(codice_prodotto);
CREATE INDEX idx_prodotti_disponibile ON prodotti(disponibile);
CREATE INDEX idx_prodotti_nome ON prodotti USING gin(to_tsvector('italian', nome));

-- =====================================================
-- TABELLA: ORDINI
-- =====================================================
CREATE TABLE ordini (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_ordine SERIAL UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clienti(id),
  ha_espositori BOOLEAN DEFAULT false,
  ha_altri_prodotti BOOLEAN DEFAULT false,
  data_ordine DATE NOT NULL DEFAULT CURRENT_DATE,
  stato VARCHAR(20) NOT NULL CHECK (stato IN ('bozza', 'confermato', 'evaso', 'annullato')) DEFAULT 'bozza',
  subtotale DECIMAL(10,2) DEFAULT 0 CHECK (subtotale >= 0),
  sconto_percentuale DECIMAL(5,2) CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100),
  sconto_valore DECIMAL(10,2) CHECK (sconto_valore >= 0),
  totale DECIMAL(10,2) DEFAULT 0 CHECK (totale >= 0),
  note TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ordini_cliente ON ordini(cliente_id);
CREATE INDEX idx_ordini_stato ON ordini(stato);
CREATE INDEX idx_ordini_data ON ordini(data_ordine DESC);
CREATE INDEX idx_ordini_numero ON ordini(numero_ordine);

-- =====================================================
-- TABELLA: RIGHE_ORDINE
-- =====================================================
CREATE TABLE righe_ordine (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordine_id UUID NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id UUID NOT NULL REFERENCES prodotti(id),
  quantita DECIMAL(10,2) NOT NULL CHECK (quantita > 0),
  prezzo_unitario DECIMAL(10,2) NOT NULL CHECK (prezzo_unitario >= 0),
  subtotale_riga DECIMAL(10,2) NOT NULL CHECK (subtotale_riga >= 0),
  note_riga TEXT,
  ordine_riga INTEGER DEFAULT 0
);

CREATE INDEX idx_righe_ordine ON righe_ordine(ordine_id);
CREATE INDEX idx_righe_prodotto ON righe_ordine(prodotto_id);
CREATE INDEX idx_righe_ordine_riga ON righe_ordine(ordine_id, ordine_riga);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON clienti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prodotti_updated_at BEFORE UPDATE ON prodotti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordini_updated_at BEFORE UPDATE ON ordini
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_ordine_flags()
RETURNS TRIGGER AS $$
DECLARE
  v_ordine_id UUID;
  v_ha_espositori BOOLEAN;
  v_ha_altri BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_ordine_id := OLD.ordine_id;
  ELSE
    v_ordine_id := NEW.ordine_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM righe_ordine r
    JOIN prodotti p ON r.prodotto_id = p.id
    JOIN categorie c ON p.categoria_id = c.id
    LEFT JOIN categorie c_parent ON c.parent_id = c_parent.id
    WHERE r.ordine_id = v_ordine_id
      AND COALESCE(c_parent.tipo_ordine, c.tipo_ordine) = 'espositori'
  ) INTO v_ha_espositori;

  SELECT EXISTS (
    SELECT 1 
    FROM righe_ordine r
    JOIN prodotti p ON r.prodotto_id = p.id
    JOIN categorie c ON p.categoria_id = c.id
    LEFT JOIN categorie c_parent ON c.parent_id = c_parent.id
    WHERE r.ordine_id = v_ordine_id
      AND COALESCE(c_parent.tipo_ordine, c.tipo_ordine) = 'non_espositori'
  ) INTO v_ha_altri;

  UPDATE ordini 
  SET 
    ha_espositori = v_ha_espositori,
    ha_altri_prodotti = v_ha_altri,
    updated_at = NOW()
  WHERE id = v_ordine_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ordine_flags
  AFTER INSERT OR UPDATE OR DELETE ON righe_ordine
  FOR EACH ROW EXECUTE FUNCTION update_ordine_flags();

CREATE OR REPLACE FUNCTION calculate_subtotale_riga()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotale_riga := NEW.quantita * NEW.prezzo_unitario;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_subtotale_riga
  BEFORE INSERT OR UPDATE ON righe_ordine
  FOR EACH ROW EXECUTE FUNCTION calculate_subtotale_riga();

CREATE OR REPLACE FUNCTION update_ordine_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_ordine_id UUID;
  v_subtotale DECIMAL(10,2);
  v_sconto_perc DECIMAL(5,2);
  v_sconto_val DECIMAL(10,2);
  v_totale DECIMAL(10,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_ordine_id := OLD.ordine_id;
  ELSE
    v_ordine_id := NEW.ordine_id;
  END IF;

  SELECT COALESCE(SUM(subtotale_riga), 0)
  INTO v_subtotale
  FROM righe_ordine
  WHERE ordine_id = v_ordine_id;

  SELECT sconto_percentuale, sconto_valore
  INTO v_sconto_perc, v_sconto_val
  FROM ordini
  WHERE id = v_ordine_id;

  v_totale := v_subtotale;

  IF v_sconto_perc IS NOT NULL AND v_sconto_perc > 0 THEN
    v_totale := v_totale * (1 - v_sconto_perc / 100);
  END IF;

  IF v_sconto_val IS NOT NULL AND v_sconto_val > 0 THEN
    v_totale := v_totale - v_sconto_val;
  END IF;

  v_totale := GREATEST(v_totale, 0);

  UPDATE ordini
  SET 
    subtotale = v_subtotale,
    totale = v_totale,
    updated_at = NOW()
  WHERE id = v_ordine_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ordine_totals
  AFTER INSERT OR UPDATE OR DELETE ON righe_ordine
  FOR EACH ROW EXECUTE FUNCTION update_ordine_totals();

CREATE OR REPLACE FUNCTION recalculate_on_discount_change()
RETURNS TRIGGER AS $$
DECLARE
  v_totale DECIMAL(10,2);
BEGIN
  IF (OLD.sconto_percentuale IS DISTINCT FROM NEW.sconto_percentuale) OR 
     (OLD.sconto_valore IS DISTINCT FROM NEW.sconto_valore) THEN
    
    v_totale := NEW.subtotale;

    IF NEW.sconto_percentuale IS NOT NULL AND NEW.sconto_percentuale > 0 THEN
      v_totale := v_totale * (1 - NEW.sconto_percentuale / 100);
    END IF;

    IF NEW.sconto_valore IS NOT NULL AND NEW.sconto_valore > 0 THEN
      v_totale := v_totale - NEW.sconto_valore;
    END IF;

    NEW.totale := GREATEST(v_totale, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_on_discount
  BEFORE UPDATE ON ordini
  FOR EACH ROW EXECUTE FUNCTION recalculate_on_discount_change();

CREATE OR REPLACE FUNCTION get_prodotto_tipo_ordine(p_prodotto_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_tipo VARCHAR;
BEGIN
  SELECT COALESCE(c_parent.tipo_ordine, c.tipo_ordine)
  INTO v_tipo
  FROM prodotti p
  JOIN categorie c ON p.categoria_id = c.id
  LEFT JOIN categorie c_parent ON c.parent_id = c_parent.id
  WHERE p.id = p_prodotto_id;
  
  RETURN v_tipo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION genera_codice_prodotto(p_nome_prodotto VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefisso VARCHAR(4);
  v_progressivo INTEGER;
  v_codice VARCHAR(50);
  parole TEXT[];
BEGIN
  SELECT ARRAY_AGG(word)
  INTO parole
  FROM (
    SELECT unnest(string_to_array(p_nome_prodotto, ' ')) AS word
  ) w
  WHERE length(word) > 2
  LIMIT 2;

  IF array_length(parole, 1) >= 2 THEN
    v_prefisso := upper(substring(parole[1], 1, 2) || substring(parole[2], 1, 2));
  ELSIF array_length(parole, 1) = 1 THEN
    v_prefisso := upper(substring(parole[1], 1, 4));
  ELSE
    v_prefisso := 'PROD';
  END IF;

  SELECT COALESCE(MAX(
    CASE 
      WHEN codice_prodotto ~ ('^' || v_prefisso || '-[0-9]+$') 
      THEN substring(codice_prodotto from '[0-9]+$')::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO v_progressivo
  FROM prodotti;

  v_codice := v_prefisso || '-' || lpad(v_progressivo::TEXT, 3, '0');

  RETURN v_codice;
END;
$$ LANGUAGE plpgsql;
