import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type TipoModulo = 'Espositori' | 'Ricambi' | 'Gemme' | 'Nido'

type GrenkeModelKey = 'leo2' | 'leo3' | 'leo4' | 'leo5' | 'titano'

interface ModuloEspositoriOptions {
  grenkeLeasing: boolean
  grenkeModel: GrenkeModelKey
}

interface Prodotto {
  codice_prodotto: string
  nome: string
  prezzo_listino?: number
  categorie?: {
    nome: string
    tipo_ordine: string
  }
}

const GRENKE_MODELLO_TESTI: Record<GrenkeModelKey, string> = {
  leo2: 'TESTO_CONDIZIONI_LEO2',
  leo3: 'TESTO_CONDIZIONI_LEO3',
  leo4: 'TESTO_CONDIZIONI_LEO4',
  leo5: 'TESTO_CONDIZIONI_LEO5',
  titano: 'TESTO_CONDIZIONI_TITANO',
}

const GRENKE_MODELLO_CODICI: Partial<Record<GrenkeModelKey, string>> = {
  leo3: 'FDA-003',
  leo4: 'FDA-004',
}

const GRENKE_MODELLO_TABELLE: Partial<Record<GrenkeModelKey, {
  rows: {
    rate: string
    costoGiornaliero: string
    rataMensile: string
  }[]
  note: string
}>> = {
  leo2: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 8,60', rataMensile: '€ 267,28' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 6,00', rataMensile: '€ 186,04' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 4,60', rataMensile: '€ 144,70' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 3,90', rataMensile: '€ 120,98' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio\nIn caso di vendita diretta, il trasporto a carico del cliente e pagamento per bonifico bancario anticipato',
  },
  leo3: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 12,86', rataMensile: '€ 398,91' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 8,90', rataMensile: '€ 277,66' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 6,90', rataMensile: '€ 215,97' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 5,80', rataMensile: '€ 180,56' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio\nIn caso di vendita diretta, il trasporto a carico del cliente e pagamento per bonifico bancario anticipato',
  },
  leo4: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 14,60', rataMensile: '€ 455,17' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 10,22', rataMensile: '€ 316,83' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 7,90', rataMensile: '€ 246,43' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 6,60', rataMensile: '€ 206,02' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio\nIn caso di vendita diretta, il trasporto a carico del cliente e pagamento per bonifico bancario anticipato',
  },
  leo5: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 16,60', rataMensile: '€ 517,42' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 11,60', rataMensile: '€ 360,16' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 9,00', rataMensile: '€ 280,13' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 7,50', rataMensile: '€ 234,20' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio\nIn caso di vendita diretta, il trasporto a carico del cliente e pagamento per bonifico bancario anticipato',
  },
  titano: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 14,80', rataMensile: '€ 460,80' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 10,30', rataMensile: '€ 320,74' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 8,04', rataMensile: '€ 249,48' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 6,70', rataMensile: '€ 208,57' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio\nIn caso di vendita diretta, il trasporto a carico del cliente e pagamento per bonifico bancario anticipato',
  },
}

const normalizeProductCode = (codice: string) => (codice || '').toUpperCase().replace(/_/g, '-').trim()

const normalizeGrenkeProductName = (nome: string) => {
  const lower = (nome || '').toLowerCase()
  const withAlias = lower.replace(/leonardo/g, 'leo')

  const romanReplaced = withAlias
    .replace(/\biii\b/g, '3')
    .replace(/\biv\b/g, '4')
    .replace(/\bv\b/g, '5')
    .replace(/\bii\b/g, '2')

  return romanReplaced.replace(/[^a-z0-9]/g, '')
}

const matchesGrenkeModel = (nome: string, modelKey: GrenkeModelKey) => {
  const n = normalizeGrenkeProductName(nome)
  switch (modelKey) {
    case 'leo2':
      return n.includes('leo2')
    case 'leo3':
      return n.includes('leo3')
    case 'leo4':
      return n.includes('leo4')
    case 'leo5':
      return n.includes('leo5')
    case 'titano':
      return n.includes('titano')
  }
}

const pickBestGrenkeModelProduct = (
  prodotti: { codice: string; nome: string; prezzo: number }[],
  modelKey: GrenkeModelKey
) => {
  const codiceTarget = GRENKE_MODELLO_CODICI[modelKey]
  if (codiceTarget) {
    const targetNorm = normalizeProductCode(codiceTarget)
    const byCode = (prodotti || []).find(p => normalizeProductCode(p.codice) === targetNorm)
    if (byCode) return byCode
  }

  const candidates = (prodotti || []).filter(p => matchesGrenkeModel(p.nome || '', modelKey))
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]

  const scored = candidates
    .map(p => {
      const normalized = normalizeGrenkeProductName(p.nome || '')
      const idx = normalized.indexOf(modelKey)
      const extraLen = idx >= 0 ? normalized.length - modelKey.length : normalized.length
      return { p, idx, extraLen, normalizedLen: normalized.length }
    })
    .sort((a, b) => {
      if (a.idx !== b.idx) return a.idx - b.idx
      if (a.extraLen !== b.extraLen) return a.extraLen - b.extraLen
      return a.normalizedLen - b.normalizedLen
    })

  console.warn('⚠️ Più prodotti matchano il modello Grenke, seleziono il migliore', {
    modelKey,
    candidates: scored.map(x => ({ codice: x.p.codice, nome: x.p.nome })),
    selected: { codice: scored[0].p.codice, nome: scored[0].p.nome },
  })

  return scored[0].p
}

const MODULO_BOTTOM_MARGIN = 45

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })

const loadFirstAvailableImage = async (sources: string[]) => {
  for (const src of sources) {
    try {
      return await loadImage(src)
    } catch {
      // ignore
    }
  }
  throw new Error(`Failed to load image from sources: ${sources.join(', ')}`)
}

const renderGrenkeLeasingCondizioni = (doc: jsPDF, modelKey: GrenkeModelKey, startY: number) => {
  const table = GRENKE_MODELLO_TABELLE[modelKey]
  if (!table) return { finalY: startY, rendered: false }

  autoTable(doc, {
    startY,
    head: [['N° rate', 'NOLEGGIO CON RISCATTO *', 'Rata mensile']],
    body: table.rows.map(r => [r.rate, r.costoGiornaliero, r.rataMensile]),
    theme: 'grid',
    margin: { left: 20, right: 20, bottom: MODULO_BOTTOM_MARGIN },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 110 },
      2: { cellWidth: 42, halign: 'right' },
    },
  })

  const afterTableY = (doc as any).lastAutoTable.finalY + 4
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const splitNote = doc.splitTextToSize(table.note, 170)
  doc.text(splitNote, 20, afterTableY)

  return { finalY: afterTableY + splitNote.length * 4, rendered: true }
}

export const generateModuloVuoto = async (
  tipo: TipoModulo, 
  numeroCopie: number = 1,
  prodottiDB?: Prodotto[],
  eventoPrecompilato?: string,
  espositoriOptions?: ModuloEspositoriOptions
) => {
  console.log('🚀 generateModuloVuoto CHIAMATA!', { tipo, numeroCopie, prodottiDB: prodottiDB?.length })
  
  const doc = new jsPDF()

  let logoImg: HTMLImageElement | null = null
  try {
    const baseUrl = import.meta.env.BASE_URL || '/'
    logoImg = await loadFirstAvailableImage([
      `${baseUrl}logo.png`,
      'logo.png',
      '/logo.png',
    ])
  } catch (e) {
    console.error(e)
  }

  // Filtra prodotti per tipo se forniti
  let prodottiFiltrati: { codice: string; nome: string; prezzo: number }[] = []
  
  if (prodottiDB && prodottiDB.length > 0) {
    const categoriaMap: Record<TipoModulo, string[]> = {
      'Espositori': ['ESPOSITORI', 'Nuovi', 'Usati'],
      'Ricambi': ['Ricambi'],
      'Gemme': ['Gemme'],
      'Nido': ['Nido']
    }
    
    const categorieDaCercare = categoriaMap[tipo]
    
    prodottiFiltrati = prodottiDB
      .filter(p => {
        const nomeCategoria = p.categorie?.nome
        return categorieDaCercare.some(cat => nomeCategoria === cat)
      })
      .map(p => ({
        codice: p.codice_prodotto,
        nome: p.nome,
        prezzo: p.prezzo_listino || 0
      }))

    // DEBUG
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 Tipo modulo selezionato:', tipo)
    console.log('📋 Categorie da cercare:', categorieDaCercare)
    console.log('📦 Prodotti totali ricevuti:', prodottiDB?.length || 0)
    console.log('📦 Primi 5 prodotti DB:', prodottiDB?.slice(0, 5).map(p => ({ 
      codice: p.codice_prodotto, 
      nome: p.nome, 
      categoria: p.categorie?.nome 
    })))
    console.log('✅ Prodotti filtrati:', prodottiFiltrati.length)
    console.log('✅ Primi 10 filtrati:', prodottiFiltrati.slice(0, 10))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  // Genera N copie
  for (let copia = 0; copia < numeroCopie; copia++) {
    if (copia > 0) {
      doc.addPage()
    }

    // Logo
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 20, 8, 60, 18)
    }

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`MODULO PREVENTIVO ${tipo.toUpperCase()}`, 95, 16)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Fior d\'Acqua - Espositori Refrigerati', 95, 22)

    // Linea separatore
    doc.setLineWidth(0.5)
    doc.line(20, 28, 190, 28)

    let yPos = 36

    // Evento e Data - LINEE SOTTILISSIME
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Evento:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setLineWidth(0.1)
    if (eventoPrecompilato) {
      doc.setFont('helvetica', 'bold')
      doc.text(eventoPrecompilato, 42, yPos)
      doc.setFont('helvetica', 'normal')
    } else {
      doc.line(40, yPos, 110, yPos)
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Data:', 120, yPos)
    doc.setFont('helvetica', 'normal')
    doc.line(135, yPos, 190, yPos)

    yPos += 10

    // Dati Cliente
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('DATI CLIENTE', 20, yPos)

    yPos += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    doc.text('Ragione Sociale:', 20, yPos)
    doc.line(50, yPos, 190, yPos)
    yPos += 6

    doc.text('Referente:', 20, yPos)
    doc.line(40, yPos, 110, yPos)
    doc.text('Tel:', 120, yPos)
    doc.line(130, yPos, 190, yPos)
    yPos += 6

    doc.text('Indirizzo:', 20, yPos)
    doc.line(40, yPos, 190, yPos)
    yPos += 6

    doc.text('Città:', 20, yPos)
    doc.line(35, yPos, 100, yPos)
    doc.text('CAP:', 110, yPos)
    doc.line(122, yPos, 150, yPos)
    doc.text('Prov:', 160, yPos)
    doc.line(173, yPos, 190, yPos)
    yPos += 6

    doc.text('P.IVA:', 20, yPos)
    doc.line(35, yPos, 100, yPos)
    doc.text('Email:', 110, yPos)
    doc.line(125, yPos, 190, yPos)

    yPos += 10

    // Tabella Prodotti
    doc.setFont('helvetica', 'bold')
    doc.text('PRODOTTI', 20, yPos)

    yPos += 3

    const isGrenke = tipo === 'Espositori' && espositoriOptions?.grenkeLeasing

    // Prepara righe tabella
    let righeTabella: string[][]
    let tableHead: string[][] = [['Codice', 'Descrizione Prodotto', 'Q.tà', 'Prezzo €', 'Totale €']]
    let columnStyles: Record<number, any> = {
      0: { cellWidth: 25 },
      1: { cellWidth: 82 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 23, halign: 'right' },
    }

    if (isGrenke) {
      const modelDisplayName = espositoriOptions!.grenkeModel.toUpperCase()
      const testoCondizioni = GRENKE_MODELLO_TESTI[espositoriOptions!.grenkeModel]

      const prodottoModel = pickBestGrenkeModelProduct((prodottiFiltrati || []), espositoriOptions!.grenkeModel)
      if (!prodottoModel) {
        console.warn('❗ Prodotto modello Grenke non trovato', {
          model: espositoriOptions!.grenkeModel,
          esempioNomi: (prodottiFiltrati || []).slice(0, 20).map(p => p.nome),
        })
      }
      const codice = prodottoModel?.codice || ''
      const prezzo = prodottoModel?.prezzo ?? 0
      const scontoPerc = espositoriOptions!.grenkeModel === 'leo2' ? 5 : 10
      const subtotale = prezzo * (1 - scontoPerc / 100)

      tableHead = [['Codice', 'Modello', 'Q.tà', 'Prezzo €', 'Sconto %', 'Subtotale €']]
      righeTabella = [[
        codice,
        modelDisplayName,
        '1',
        prezzo ? prezzo.toFixed(2).replace('.', ',') : '',
        `${scontoPerc}%`,
        prezzo ? subtotale.toFixed(2).replace('.', ',') : '',
      ]]

      columnStyles = {
        0: { cellWidth: 25 },
        1: { cellWidth: 77 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
      }

      autoTable(doc, {
        startY: yPos,
        head: tableHead,
        body: righeTabella,
        theme: 'grid',
        margin: { left: 20, right: 20, bottom: MODULO_BOTTOM_MARGIN },
        headStyles: {
          fillColor: [34, 139, 34],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineWidth: 0.1,
          lineColor: [100, 100, 100],
          minCellHeight: 5.5,
        },
        columnStyles,
      })

      let postTableY = (doc as any).lastAutoTable.finalY + 6

      const rendered = renderGrenkeLeasingCondizioni(doc, espositoriOptions!.grenkeModel, postTableY)
      if (rendered.rendered) {
        postTableY = rendered.finalY
      } else {
        const boxPadding = 3
        const boxWidth = 170
        const splitText = doc.splitTextToSize(testoCondizioni, boxWidth - boxPadding * 2)
        const boxHeight = splitText.length * 4 + boxPadding * 2 + 4

        doc.setFillColor(245, 245, 245)
        doc.rect(20, postTableY, boxWidth, boxHeight, 'F')
        doc.setDrawColor(200, 200, 200)
        doc.rect(20, postTableY, boxWidth, boxHeight, 'S')

        doc.setFont('helvetica', 'bold')
        doc.text('Condizioni Leasing:', 20 + boxPadding, postTableY + boxPadding + 4)
        doc.setFont('helvetica', 'normal')
        doc.text(splitText, 20 + boxPadding, postTableY + boxPadding + 9)

        postTableY += boxHeight
      }

      // Totali
      const finalY = postTableY + 5

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setLineWidth(0.1)
      doc.text('Subtotale:', 130, finalY)
      doc.line(155, finalY, 190, finalY)

      doc.text('Sconto (%):', 130, finalY + 6)
      doc.line(155, finalY + 6, 165, finalY + 6)
      doc.text('€:', 170, finalY + 6)
      doc.line(175, finalY + 6, 190, finalY + 6)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('TOTALE:', 130, finalY + 12)
      doc.setLineWidth(0.3)
      doc.line(155, finalY + 12, 190, finalY + 12)

      // Condizioni Trasporto
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('CONDIZIONI TRASPORTO:', 20, finalY + 15)

      doc.setFont('helvetica', 'normal')
      doc.setLineWidth(0.1)
      doc.rect(20, finalY + 17, 3, 3)
      doc.text('Franco Destino', 25, finalY + 20)

      doc.rect(70, finalY + 17, 3, 3)
      doc.text('Porto Assegnato', 75, finalY + 20)

      // Note
      doc.setFont('helvetica', 'bold')
      doc.text('Note:', 20, finalY + 26)
      doc.setFont('helvetica', 'normal')
      doc.line(20, finalY + 28, 190, finalY + 28)
      doc.line(20, finalY + 33, 190, finalY + 33)

      // Footer
      const pageHeight = doc.internal.pageSize.height

      const footerHeight = 18
      const footerTop = pageHeight - footerHeight

      doc.setFillColor(240, 240, 240)
      doc.rect(0, footerTop, 210, footerHeight, 'F')

      doc.setDrawColor(34, 139, 34)
      doc.setLineWidth(0.5)
      doc.line(0, footerTop, 210, footerTop)

      doc.setFontSize(6)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')

      let footerY = footerTop + 4
      doc.text('Fior di Verbena di Zanotti Leonardo', 105, footerY, { align: 'center' })

      footerY += 3
      doc.setFont('helvetica', 'normal')
      doc.text('Via Cà dei Lunghi, 54 - Borgo Maggiore 47894 - San Marino', 105, footerY, { align: 'center' })

      footerY += 3
      doc.text('Tel: 0549 907005 - Cell: 373 7170588', 105, footerY, { align: 'center' })

      footerY += 3
      doc.text('Email: info@fiordacqua.com - fiordacqua@gmail.com', 105, footerY, { align: 'center' })

      footerY += 3
      doc.text('IBAN: SM 63 L 08540 09800 000060191115', 105, footerY, { align: 'center' })

      continue
    }

    if (prodottiFiltrati.length > 0) {
      // Popola con prodotti esistenti
      righeTabella = prodottiFiltrati.map(p => [
        p.codice,
        p.nome,
        '',
        p.prezzo.toFixed(2).replace('.', ','),
        ''
      ])
      // Aggiungi righe vuote se meno di 18
      while (righeTabella.length < 18) {
        righeTabella.push(['', '', '', '', ''])
      }
    } else {
      // 18 righe vuote
      righeTabella = Array(18).fill(['', '', '', '', ''])
    }

    autoTable(doc, {
      startY: yPos,
      head: tableHead,
      body: righeTabella,
      theme: 'grid',
      margin: { left: 20, right: 20, bottom: MODULO_BOTTOM_MARGIN },
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineWidth: 0.1,
        lineColor: [100, 100, 100],
        minCellHeight: 5.5,
      },
      columnStyles,
    })

    // Totali
    const finalY = (doc as any).lastAutoTable.finalY + 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setLineWidth(0.1)
    doc.text('Subtotale:', 130, finalY)
    doc.line(155, finalY, 190, finalY)

    doc.text('Sconto (%):', 130, finalY + 6)
    doc.line(155, finalY + 6, 165, finalY + 6)
    doc.text('€:', 170, finalY + 6)
    doc.line(175, finalY + 6, 190, finalY + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('TOTALE:', 130, finalY + 12)
    doc.setLineWidth(0.3)
    doc.line(155, finalY + 12, 190, finalY + 12)

    // Condizioni Trasporto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CONDIZIONI TRASPORTO:', 20, finalY + 15)

    doc.setFont('helvetica', 'normal')
    doc.setLineWidth(0.1)
    doc.rect(20, finalY + 17, 3, 3)
    doc.text('Franco Destino', 25, finalY + 20)

    doc.rect(70, finalY + 17, 3, 3)
    doc.text('Porto Assegnato', 75, finalY + 20)

    // Note
    doc.setFont('helvetica', 'bold')
    doc.text('Note:', 20, finalY + 26)
    doc.setFont('helvetica', 'normal')
    doc.line(20, finalY + 28, 190, finalY + 28)
    doc.line(20, finalY + 33, 190, finalY + 33)

    // Footer
    const pageHeight = doc.internal.pageSize.height

    const footerHeight = 18
    const footerTop = pageHeight - footerHeight

    doc.setFillColor(240, 240, 240)
    doc.rect(0, footerTop, 210, footerHeight, 'F')

    doc.setDrawColor(34, 139, 34)
    doc.setLineWidth(0.5)
    doc.line(0, footerTop, 210, footerTop)

    doc.setFontSize(6)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')

    let footerY = footerTop + 4
    doc.text('Fior di Verbena di Zanotti Leonardo', 105, footerY, { align: 'center' })

    footerY += 3
    doc.setFont('helvetica', 'normal')
    doc.text('Via Cà dei Lunghi, 54 - Borgo Maggiore 47894 - San Marino', 105, footerY, { align: 'center' })

    footerY += 3
    doc.text('Tel: 0549 907005 - Cell: 373 7170588', 105, footerY, { align: 'center' })

    footerY += 3
    doc.text('Email: info@fiordacqua.com - fiordacqua@gmail.com', 105, footerY, { align: 'center' })

    footerY += 3
    doc.text('IBAN: SM 63 L 08540 09800 000060191115', 105, footerY, { align: 'center' })
  }

  // Salva PDF
  const fileName = `Modulo_${tipo}_${numeroCopie}copie.pdf`
  doc.save(fileName)
}