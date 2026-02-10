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

const renderDocumentoPage = (doc: jsPDF, ordine: Ordine, tipoDocumento: TipoDocumento) => {
  const isPreventivo = tipoDocumento === 'preventivo'
  const labelDocumento = isPreventivo ? 'PREVENTIVO' : 'ORDINE'

  const logoImg = new Image()
  logoImg.src = `${import.meta.env.BASE_URL}logo.png`
  doc.addImage(logoImg, 'PNG', 20, 14, 60, 18)

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
      `ESPOSITORI - ${ordine.tipo_vendita_espositori === 'diretto' ? 'VENDITA DIRETTA' : 'LEASING GRENKE'}`,
      105,
      yPos,
      { align: 'center' }
    )
    doc.setTextColor(0, 0, 0)
    yPos += 10
  }
  
  // Tabella Prodotti con griglia stile Excel
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
      0: { cellWidth: 30 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  })
  
  // Totali
  const finalY = (doc as any).lastAutoTable.finalY + 10
  
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotale:', 130, finalY)
  doc.text(formatCurrency(ordine.subtotale), 185, finalY, { align: 'right' })
  
  if (ordine.sconto_valore && ordine.sconto_valore > 0) {
    const labelSconto = ordine.sconto_percentuale && ordine.sconto_percentuale > 0
      ? `Sconto (${ordine.sconto_percentuale}%):`
      : 'Sconto:'
    doc.text(labelSconto, 130, finalY + 6)
    doc.text(`- ${formatCurrency(ordine.sconto_valore)}`, 185, finalY + 6, { align: 'right' })
  } 
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  const totalY = (ordine.sconto_valore && ordine.sconto_valore > 0) ? finalY + 12 : finalY + 6
  doc.text('TOTALE:', 130, totalY)
  doc.text(formatCurrency(ordine.totale), 185, totalY, { align: 'right' })
  
  // Note
  if (ordine.note) {
    const notesY = (ordine.sconto_valore && ordine.sconto_valore > 0) ? finalY + 20 : finalY + 14
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Note:', 20, notesY)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(ordine.note, 170)
    doc.text(splitNotes, 20, notesY + 5)
  }
  
  // Footer con dati aziendali
  const pageHeight = doc.internal.pageSize.height
  
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

export const generateOrdinePDF = (ordine: Ordine, numeroCopie: number = 1) => {
  const doc = new jsPDF()

  for (let i = 0; i < numeroCopie; i++) {
    if (i > 0) doc.addPage()
    renderDocumentoPage(doc, ordine, 'ordine')
  }

  doc.save(getDocumentoFileName(ordine, 'ordine', numeroCopie))
}

export const generatePreventivoPDF = (ordine: Ordine, numeroCopie: number = 1) => {
  const doc = new jsPDF()

  for (let i = 0; i < numeroCopie; i++) {
    if (i > 0) doc.addPage()
    renderDocumentoPage(doc, ordine, 'preventivo')
  }

  doc.save(getDocumentoFileName(ordine, 'preventivo', numeroCopie))
}