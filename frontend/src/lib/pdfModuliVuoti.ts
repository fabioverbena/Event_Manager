import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type TipoModulo = 'Espositori' | 'Ricambi' | 'Gemme' | 'Nido'

const MODULO_BOTTOM_MARGIN = 45

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })

interface Prodotto {
  codice_prodotto: string
  nome: string
  prezzo_listino?: number
  categorie?: {
    nome: string
    tipo_ordine: string
  }
}

export const generateModuloVuoto = async (
  tipo: TipoModulo, 
  numeroCopie: number = 1,
  prodottiDB?: Prodotto[],
  eventoPrecompilato?: string
) => {
  console.log('🚀 generateModuloVuoto CHIAMATA!', { tipo, numeroCopie, prodottiDB: prodottiDB?.length })
  
  const doc = new jsPDF()

  let logoImg: HTMLImageElement | null = null
  try {
    logoImg = await loadImage(`${import.meta.env.BASE_URL}logo.png`)
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
    doc.text(`MODULO ORDINE ${tipo.toUpperCase()}`, 95, 16)

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

    // Prepara righe tabella
    let righeTabella: string[][]
    
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
      head: [['Codice', 'Descrizione Prodotto', 'Q.tà', 'Prezzo €', 'Totale €']],
      body: righeTabella,
      theme: 'grid',
      margin: { bottom: MODULO_BOTTOM_MARGIN },
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
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 82 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 23, halign: 'right' },
      },
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