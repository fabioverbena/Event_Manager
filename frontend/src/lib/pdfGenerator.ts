import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './utils'
import type { Database } from '@/types/database.types'

type Ordine = Database['public']['Tables']['ordini']['Row'] & {
  clienti?: {
    ragione_sociale: string
    nome_referente: string | null
    citta: string | null
    provincia: string | null
    indirizzo: string | null
    cap: string | null
    telefono: string | null
    cellulare: string | null
    email: string | null
    partita_iva: string | null
    codice_fiscale: string | null
  } | null
  righe_ordine?: (Database['public']['Tables']['righe_ordine']['Row'] & {
    prodotti?: {
      nome: string
      codice_prodotto: string
      unita_misura: string | null
    } | null
  })[]
}

type TipoDocumento = 'ordine' | 'preventivo'

type EspositoreImageKey = 'titano' | 'leo'

const ESPOSITORI_IMAGE_PATHS: Record<EspositoreImageKey, string> = {
  titano: 'espositori/titano.png',
  leo: 'espositori/leonardo.png',
}

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

const GRENKE_MODELLO_TESTI: Record<string, string> = {
  leo2: 'TESTO_CONDIZIONI_LEO2',
  leo3: 'TESTO_CONDIZIONI_LEO3',
  leo4: 'TESTO_CONDIZIONI_LEO4',
  leo5: 'TESTO_CONDIZIONI_LEO5',
  titano: 'TESTO_CONDIZIONI_TITANO',
  default: 'TESTO_CONDIZIONI_GRENKE_DEFAULT',
}

type GrenkeLeasingRow = {
  rate: string
  costoGiornaliero: string
  rataMensile: string
}

type GrenkeLeasingTable = {
  rows: GrenkeLeasingRow[]
  note: string
}

const GRENKE_MODELLO_TABELLE: Partial<Record<string, GrenkeLeasingTable>> = {
  leo2: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 8,60', rataMensile: '€ 267,28' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 6,00', rataMensile: '€ 186,04' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 4,60', rataMensile: '€ 144,70' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 3,90', rataMensile: '€ 120,98' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio',
  },
  leo3: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 12,86', rataMensile: '€ 398,91' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 8,90', rataMensile: '€ 277,66' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 6,90', rataMensile: '€ 215,97' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 5,80', rataMensile: '€ 180,56' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio',
  },
  leo4: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 14,60', rataMensile: '€ 455,17' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 10,22', rataMensile: '€ 316,83' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 7,90', rataMensile: '€ 246,43' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 6,60', rataMensile: '€ 206,02' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio',
  },
  leo5: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 16,60', rataMensile: '€ 517,42' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 11,60', rataMensile: '€ 360,16' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 9,00', rataMensile: '€ 280,13' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 7,50', rataMensile: '€ 234,20' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio',
  },
  titano: {
    rows: [
      { rate: '24', costoGiornaliero: 'Costo giornaliero € 14,80', rataMensile: '€ 460,80' },
      { rate: '36', costoGiornaliero: 'Costo giornaliero € 10,30', rataMensile: '€ 320,74' },
      { rate: '48', costoGiornaliero: 'Costo giornaliero € 8,04', rataMensile: '€ 249,48' },
      { rate: '60', costoGiornaliero: 'Costo giornaliero € 6,70', rataMensile: '€ 208,57' },
    ],
    note: '*La prima rata si paga 6 mesi dopo la consegna, bene strumentale totalmente deducibile. Prezzo comprensivo di trasporto e montaggio',
  },
}

const renderGrenkeLeasingCondizioni = (doc: jsPDF, modelKey: string, startY: number) => {
  const table = GRENKE_MODELLO_TABELLE[modelKey]
  if (!table) return { finalY: startY, rendered: false }

  autoTable(doc, {
    startY,
    head: [['N° rate', 'NOLEGGIO CON RISCATTO *', 'Rata mensile']],
    body: table.rows.map(r => [r.rate, r.costoGiornaliero, r.rataMensile]),
    theme: 'grid',
    margin: { left: 20, right: 20 },
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

const getGrenkeModelKeyFromNomeProdotto = (nome: string) => {
  const n = normalizeGrenkeProductName(nome)
  if (n.includes('leo2')) return 'leo2'
  if (n.includes('leo3')) return 'leo3'
  if (n.includes('leo4')) return 'leo4'
  if (n.includes('leo5')) return 'leo5'
  if (n.includes('titano')) return 'titano'
  return 'default'
}

const getGrenkeModelDisplayName = (ordine: Ordine) => {
  const nome = (ordine.righe_ordine || [])
    .map(r => r.prodotti?.nome)
    .find(Boolean)
  return nome || ''
}

const matchesGrenkeModel = (nome: string, modelKey: string) => {
  const n = normalizeGrenkeProductName(nome)
  if (!n) return false
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
    default:
      return false
  }
}

const detectEspositoreImageKeys = (ordine: Ordine): EspositoreImageKey[] => {
  const rows = ordine.righe_ordine || []
  const keys = new Set<EspositoreImageKey>()

  for (const r of rows) {
    const nome = r.prodotti?.nome || ''
    const codice = r.prodotti?.codice_prodotto || ''
    const n = normalizeGrenkeProductName(`${codice} ${nome}`)

    if (n.includes('titano')) {
      keys.add('titano')
      continue
    }
    if (n.includes('leo')) {
      keys.add('leo')
    }
  }

  return Array.from(keys)
}

const renderEspositoriImages = async (doc: jsPDF, ordine: Ordine, startY: number, maxBottomY: number) => {
  const keys = detectEspositoreImageKeys(ordine)
  if (keys.length === 0) return startY

  const baseUrl = import.meta.env.BASE_URL || '/'
  let yPos = startY

  const availableHeight = () => Math.max(0, maxBottomY - yPos)

  const leftX = 20
  const contentWidth = 170
  const gap = 6
  const minHeight = 12

  const loadKeyImage = async (key: EspositoreImageKey): Promise<HTMLImageElement | null> => {
    try {
      return await loadFirstAvailableImage([
        `${baseUrl}${ESPOSITORI_IMAGE_PATHS[key]}`,
        `/${ESPOSITORI_IMAGE_PATHS[key]}`,
        ESPOSITORI_IMAGE_PATHS[key],
      ])
    } catch {
      return null
    }
  }

  const loaded: HTMLImageElement[] = []
  for (const k of keys) {
    const img = await loadKeyImage(k)
    if (img) loaded.push(img)
  }
  if (loaded.length === 0) return startY

  const imgs = loaded.slice(0, 2)
  if (availableHeight() < minHeight) return startY

  if (imgs.length === 1) {
    const img = imgs[0]

    const imgW = img.naturalWidth || img.width
    const imgH = img.naturalHeight || img.height
    if (!imgW || !imgH) return yPos

    const maxH = Math.max(minHeight, availableHeight())
    const scale = Math.min(contentWidth / imgW, maxH / imgH)
    const w = imgW * scale
    const h = imgH * scale

    if (availableHeight() < Math.min(minHeight, h)) return yPos
    doc.addImage(img, 'PNG', leftX, yPos, w, h)
    yPos += h + gap
    return yPos
  }

  const imgLeft = imgs[0]
  const imgRight = imgs[1]

  const slotW = (contentWidth - gap) / 2
  const slotH = Math.max(minHeight, availableHeight())

  const calcScaled = (img: HTMLImageElement) => {
    const imgW = img.naturalWidth || img.width
    const imgH = img.naturalHeight || img.height
    if (!imgW || !imgH) return { w: slotW, h: minHeight }
    const scale = Math.min(slotW / imgW, slotH / imgH)
    return { w: imgW * scale, h: imgH * scale }
  }

  const leftScaled = calcScaled(imgLeft)
  const rightScaled = calcScaled(imgRight)
  const rowH = Math.max(leftScaled.h, rightScaled.h)

  if (availableHeight() < Math.min(minHeight, rowH)) return yPos
  doc.addImage(imgLeft, 'PNG', leftX, yPos, leftScaled.w, leftScaled.h)
  doc.addImage(imgRight, 'PNG', leftX + slotW + gap, yPos, rightScaled.w, rightScaled.h)
  yPos += rowH + gap
  return yPos
}

const renderDocumentoPage = async (doc: jsPDF, ordine: Ordine, tipoDocumento: TipoDocumento) => {
  const isPreventivo = tipoDocumento === 'preventivo'
  const labelDocumento = isPreventivo ? 'PREVENTIVO' : 'ORDINE'

  const righeForTotals = ordine.righe_ordine || []
  const subtotaleLordoDerivato = righeForTotals.reduce((sum, r) => {
    return sum + (Number(r.prezzo_unitario) || 0) * (Number(r.quantita) || 0)
  }, 0)

  const subtotaleNettoDerivato = righeForTotals.reduce((sum, r) => {
    const fallback = (Number(r.prezzo_unitario) || 0) * (Number(r.quantita) || 0)
    return sum + (Number(r.subtotale_riga) || fallback)
  }, 0)

  const ordineScontoValore = Number(ordine.sconto_valore) || 0
  const ordineScontoPerc = Number(ordine.sconto_percentuale) || 0
  const scontoRigheDerivato = Math.max(0, subtotaleLordoDerivato - subtotaleNettoDerivato)

  const scontoValoreDerivato = ordineScontoValore > 0
    ? ordineScontoValore
    : ordineScontoPerc > 0
      ? (subtotaleNettoDerivato * ordineScontoPerc) / 100
      : scontoRigheDerivato

  const subtotaleDerivato = subtotaleLordoDerivato
  const totaleDerivato = Math.max(0, subtotaleDerivato - scontoValoreDerivato)

  const tipoVenditaEspositoriNorm = (ordine.tipo_vendita_espositori || '').toString().toLowerCase()
  const isLeasingGrenke = tipoVenditaEspositoriNorm.includes('leasing')

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

  if (logoImg) {
    doc.addImage(logoImg, 'PNG', 20, 14, 60, 18)
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FIOR D\'ACQUA', 95, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Espositori Refrigerati per Fiori Recisi', 95, 27)
  doc.text('www.fiordacqua.com', 95, 32)
  
  doc.setLineWidth(0.5)
  doc.line(20, 40, 190, 40)
  
  let yPos = 50
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${labelDocumento} #${ordine.numero_ordine.toString().padStart(4, '0')}`, 20, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // Evento e Data
  if (ordine.nome_evento) {
    doc.setFont('helvetica', 'bold')
    doc.text('Evento:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(ordine.nome_evento, 50, yPos)
    yPos += 6
  }
  
  doc.setFont('helvetica', 'bold')
  doc.text('Data:', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(ordine.data_ordine), 50, yPos)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Stato:', 120, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(ordine.stato.toUpperCase(), 140, yPos)
  
  yPos += 10
  
  // Dati Cliente
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', 20, yPos)
  
  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (ordine.clienti) {
    const cliente = ordine.clienti
    
    doc.setFont('helvetica', 'bold')
    doc.text(cliente.ragione_sociale, 20, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    
    if (cliente.nome_referente) {
      doc.text(`Ref: ${cliente.nome_referente}`, 20, yPos)
      yPos += 5
    }
    
    if (cliente.indirizzo) {
      doc.text(cliente.indirizzo, 20, yPos)
      yPos += 5
    }
    
    if (cliente.citta || cliente.cap || cliente.provincia) {
      const location = [cliente.cap, cliente.citta, cliente.provincia].filter(Boolean).join(' ')
      doc.text(location, 20, yPos)
      yPos += 5
    }
    
    if (cliente.telefono || cliente.cellulare) {
      const phone = [cliente.telefono, cliente.cellulare].filter(Boolean).join(' / ')
      doc.text(`Tel: ${phone}`, 20, yPos)
      yPos += 5
    }
    
    if (cliente.partita_iva) {
      doc.text(`P.IVA: ${cliente.partita_iva}`, 20, yPos)
      yPos += 5
    }
    
    if (cliente.codice_fiscale) {
      doc.text(`C.F.: ${cliente.codice_fiscale}`, 20, yPos)
      yPos += 5
    }
  }
  
  yPos += 5
  
  // Tipo vendita espositori
  if (ordine.ha_espositori && ordine.tipo_vendita_espositori) {
    doc.setFillColor(59, 130, 246)
    doc.rect(20, yPos - 4, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `ESPOSITORI - ${isLeasingGrenke ? 'LEASING GRENKE' : 'VENDITA DIRETTA'}`,
      105,
      yPos,
      { align: 'center' }
    )
    doc.setTextColor(0, 0, 0)
    yPos += 10
  }

  const isGrenkePreventivo = isPreventivo && isLeasingGrenke
  if (isGrenkePreventivo) {
    const rows = ordine.righe_ordine || []

    const detected = rows
      .map(r => ({
        row: r,
        key: getGrenkeModelKeyFromNomeProdotto(r.prodotti?.nome || ''),
      }))
      .find(x => x.key !== 'default')

    const modelKey = detected?.key || getGrenkeModelKeyFromNomeProdotto(getGrenkeModelDisplayName(ordine))
    const modelRow = detected?.row || rows.find(r => matchesGrenkeModel(r.prodotti?.nome || '', modelKey))
    const modelDisplayName = modelRow?.prodotti?.nome || getGrenkeModelDisplayName(ordine)

    const codice = modelRow?.prodotti?.codice_prodotto || ''
    const prezzoUnit = modelRow?.prezzo_unitario || 0
    const qty = modelRow?.quantita || 1
    const scontoPerc = ordine.sconto_percentuale || 0
    const gross = prezzoUnit * qty
    const scontoImporto = scontoPerc > 0
      ? gross * (scontoPerc / 100)
      : (Number(ordine.sconto_valore) || 0) > 0
        ? Number(ordine.sconto_valore)
        : 0
    const subtotaleScontato = Math.max(0, gross - scontoImporto)

    autoTable(doc, {
      startY: yPos,
      head: [['Codice', 'Modello', 'Q.tà', 'Prezzo Unit.', 'Sconto %', 'Subtotale']],
      body: [[
        codice,
        modelDisplayName || '',
        qty.toString(),
        formatCurrency(prezzoUnit),
        `${scontoPerc}%`,
        formatCurrency(subtotaleScontato),
      ]],
      theme: 'grid',
      tableWidth: 170,
      margin: { left: 20, right: 20 },
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      styles: {
        fontSize: 9,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
    })

    let postTableY = (doc as any).lastAutoTable.finalY + 6

    const rendered = renderGrenkeLeasingCondizioni(doc, modelKey, postTableY)
    if (rendered.rendered) {
      yPos = rendered.finalY + 6
    } else {
      const boxPadding = 3
      const boxWidth = 170
      const splitText = doc.splitTextToSize(GRENKE_MODELLO_TESTI[modelKey] || GRENKE_MODELLO_TESTI.default, boxWidth - boxPadding * 2)
      const boxHeight = splitText.length * 4 + boxPadding * 2 + 4

      doc.setFillColor(245, 245, 245)
      doc.rect(20, postTableY, boxWidth, boxHeight, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.rect(20, postTableY, boxWidth, boxHeight, 'S')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Condizioni Leasing:', 20 + boxPadding, postTableY + boxPadding + 4)
      doc.setFont('helvetica', 'normal')
      doc.text(splitText, 20 + boxPadding, postTableY + boxPadding + 9)

      yPos = postTableY + boxHeight + 6
    }
  }
  
  // Tabella Prodotti con griglia stile Excel
  if (!isGrenkePreventivo) {
    const tableData = (ordine.righe_ordine || []).map(riga => [
      riga.prodotti?.codice_prodotto || '',
      riga.prodotti?.nome || '',
      riga.quantita.toString() + ' ' + (riga.prodotti?.unita_misura || 'pz'),
      formatCurrency(riga.prezzo_unitario),
      formatCurrency(riga.subtotale_riga),
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Codice', 'Prodotto', 'Q.tà', 'Prezzo Unit.', 'Totale']],
      body: tableData,
      theme: 'grid', // ← GRIGLIA STILE EXCEL
      tableWidth: 170,
      margin: { left: 20, right: 20 },
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      styles: {
        fontSize: 9,
        cellPadding: 0.8,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 84 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  const pageHeight = doc.internal.pageSize.height
  const footerTopY = pageHeight - 39
  const notesBlockHeight = (() => {
    if (!ordine.note) return 0
    doc.setFontSize(10)
    const splitNotes = doc.splitTextToSize(ordine.note, 170)
    return 5 + splitNotes.length * 4 + 2
  })()

  const totalsHeight = (scontoValoreDerivato > 0 ? 12 : 6) + 10
  const maxImagesBottomY = footerTopY - 2 - (totalsHeight + notesBlockHeight)

  yPos = await renderEspositoriImages(doc, ordine, yPos, maxImagesBottomY)
  
  // Totali
  const finalY = yPos
  
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotale Lordo:', 130, finalY)
  doc.text(formatCurrency(subtotaleLordoDerivato), 185, finalY, { align: 'right' })
  
  if (scontoValoreDerivato > 0) {
    const perc = Number(ordine.sconto_percentuale) || 0
    const labelSconto = perc > 0
      ? `Sconto (${perc}%):`
      : 'Sconto:'
    doc.text(labelSconto, 130, finalY + 6)
    doc.text(`- ${formatCurrency(scontoValoreDerivato)}`, 185, finalY + 6, { align: 'right' })
  }
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  const totalY = scontoValoreDerivato > 0 ? finalY + 12 : finalY + 6
  doc.text('TOTALE:', 130, totalY)
  doc.text(formatCurrency(totaleDerivato), 185, totalY, { align: 'right' })
  
  // Note
  if (ordine.note) {
    const notesY = scontoValoreDerivato > 0 ? finalY + 20 : finalY + 14
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Note:', 20, notesY)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(ordine.note, 170)
    doc.text(splitNotes, 20, notesY + 5)
  }
  
  // Footer con dati aziendali
  // (pageHeight già calcolata sopra)
  
  // Box footer
  doc.setFillColor(240, 240, 240)
  doc.rect(0, pageHeight - 39, 210, 39, 'F')
  
  // Linea sopra footer
  doc.setDrawColor(34, 139, 34)
  doc.setLineWidth(0.5)
  doc.line(0, pageHeight - 39, 210, pageHeight - 39)
  
  // Contenuto footer
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  
  let footerY = pageHeight - 32
  doc.text('Fior di Verbena di Zanotti Leonardo', 105, footerY, { align: 'center' })
  
  footerY += 4
  doc.setFont('helvetica', 'normal')
  doc.text('Via Cà dei Lunghi, 54 - Borgo Maggiore 47894 - San Marino', 105, footerY, { align: 'center' })
  
  footerY += 4
  doc.text('Tel: 0549 907005 - Cell: 373 7170588', 105, footerY, { align: 'center' })
  
  footerY += 4
  doc.text('Email: info@fiordacqua.com - fiordacqua@gmail.com', 105, footerY, { align: 'center' })

  footerY += 4
  doc.text('IBAN: SM 63 L 08540 09800 000060191115', 105, footerY, { align: 'center' })

  footerY += 5
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Documento generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
    105,
    footerY,
    { align: 'center' }
  )
}

const getDocumentoFileName = (ordine: Ordine, tipoDocumento: TipoDocumento, numeroCopie: number) => {
  const prefix = tipoDocumento === 'preventivo' ? 'Preventivo' : 'Ordine'
  const copieSuffix = numeroCopie > 1 ? `_copie${numeroCopie}` : ''
  return `${prefix}_${ordine.numero_ordine.toString().padStart(4, '0')}_${ordine.clienti?.ragione_sociale || 'Cliente'}${copieSuffix}.pdf`
}

export const generateOrdinePDF = async (ordine: Ordine, numeroCopie: number = 1) => {
  const doc = new jsPDF()

  for (let i = 0; i < numeroCopie; i++) {
    if (i > 0) doc.addPage()
    await renderDocumentoPage(doc, ordine, 'ordine')
  }

  doc.save(getDocumentoFileName(ordine, 'ordine', numeroCopie))
}

export const generatePreventivoPDF = async (ordine: Ordine, numeroCopie: number = 1) => {
  const doc = new jsPDF()

  for (let i = 0; i < numeroCopie; i++) {
    if (i > 0) doc.addPage()
    await renderDocumentoPage(doc, ordine, 'preventivo')
  }

  doc.save(getDocumentoFileName(ordine, 'preventivo', numeroCopie))
}

export const generatePreventivoPDFBlob = async (ordine: Ordine) => {
  const doc = new jsPDF()
  await renderDocumentoPage(doc, ordine, 'preventivo')
  const filename = getDocumentoFileName(ordine, 'preventivo', 1)
  const blob = doc.output('blob')
  return { blob, filename }
}