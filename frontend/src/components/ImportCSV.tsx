import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface ImportCSVProps {
  title: string
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>
  onClose: () => void
  columns: {
    key: string
    label: string
    required?: boolean
    validate?: (value: string) => boolean
  }[]
  templateExample: string[]
}

export default function ImportCSV({ title, onImport, onClose, columns, templateExample }: ImportCSVProps) {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const requiredKeys = columns.filter(c => c.required).map(c => c.key)
  const allKeys = columns.map(c => c.key)

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Il file deve essere in formato CSV'])
      return
    }

    setFile(selectedFile)
    setErrors([])
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const rawText = e.target?.result as string
      const text = rawText.replace(/^\uFEFF/, '')
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length < 2) {
        setErrors(['Il file CSV è vuoto o non contiene dati'])
        return
      }
  
      // AUTO-RILEVA SEPARATORE (virgola o punto e virgola)
      const firstLine = lines[0]
      const semicolons = (firstLine.match(/;/g) || []).length
      const commas = (firstLine.match(/,/g) || []).length
      const separator = semicolons >= commas ? ';' : ','
  
      // Parse header
      const header = firstLine.split(separator).map(h => h.trim().replace(/['"]/g, ''))
      
      // Parse rows
      const rows: any[] = []
      const parseErrors: string[] = []
  
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/['"]/g, ''))
        
        if (values.length !== header.length) {
          parseErrors.push(`Riga ${i + 1}: numero colonne non corretto`)
          continue
        }
  
        const row: any = {}
        header.forEach((key, index) => {
          row[key] = values[index]
        })
  
        // Validate required fields
        let hasError = false
        columns.forEach(col => {
          if (col.required && !row[col.key]) {
            parseErrors.push(`Riga ${i + 1}: campo "${col.label}" obbligatorio mancante`)
            hasError = true
          }
          if (col.validate && row[col.key] && !col.validate(row[col.key])) {
            parseErrors.push(`Riga ${i + 1}: campo "${col.label}" non valido`)
            hasError = true
          }
        })
  
        if (!hasError) {
          rows.push(row)
        }
      }
  
      setData(rows)
      setErrors(parseErrors)
    }
  
    reader.onerror = () => {
      setErrors(['Errore nella lettura del file'])
    }
  
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await onImport(data)
      setResult(result)
    } catch (error) {
      setErrors(['Errore durante l\'importazione'])
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = templateExample.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${title.toLowerCase().replace(/\s/g, '_')}.csv`
    a.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Import {title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Scarica Template CSV</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Usa il template per preparare i dati nel formato corretto
                </p>
                <button onClick={downloadTemplate} className="btn-secondary text-sm">
                  Scarica Template
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-gray-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Formato file CSV</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <div className="font-medium">Separatore</div>
                    <div>Supportati: <span className="font-mono">;</span> e <span className="font-mono">,</span> (rilevato automaticamente dall'intestazione)</div>
                  </div>
                  <div>
                    <div className="font-medium">Intestazioni (prima riga)</div>
                    <div className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-1 inline-block">
                      {templateExample?.[0] || allKeys.join(',')}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Colonne obbligatorie</div>
                    <div className="font-mono text-xs bg-white border border-gray-200 rounded px-2 py-1 inline-block">
                      {requiredKeys.length > 0 ? requiredKeys.join(', ') : '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Le intestazioni devono corrispondere ai tag sopra. Ogni riga deve avere lo stesso numero di colonne dell'intestazione.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Trascina il file CSV qui
              </p>
              <p className="text-sm text-gray-500 mb-4">
                oppure clicca per selezionare
              </p>
              {file && (
                <p className="text-sm text-primary-600 font-medium">
                  File selezionato: {file.name}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Errori di validazione ({errors.length})
                  </h3>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {errors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {errors.length > 10 && (
                      <li className="font-medium">... e altri {errors.length - 10} errori</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {data.length > 0 && !result && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Anteprima ({data.length} {data.length === 1 ? 'record' : 'records'})
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {columns.map(col => (
                          <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-600">
                            {col.label}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.slice(0, 10).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {columns.map(col => (
                            <td key={col.key} className="px-4 py-2 text-gray-900">
                              {row[col.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 10 && (
                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                    Mostrati primi 10 di {data.length} records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Importazione completata!
                  </h3>
                  <p className="text-sm text-green-700">
                    Importati con successo: <strong>{result.success}</strong> records
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-red-700 font-medium mb-1">
                        Errori: {result.errors.length}
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary">
              {result ? 'Chiudi' : 'Annulla'}
            </button>
            {data.length > 0 && !result && (
              <button
                onClick={handleImport}
                disabled={importing || errors.length > 0}
                className="btn-primary"
              >
                {importing ? 'Importazione...' : `Importa ${data.length} records`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}