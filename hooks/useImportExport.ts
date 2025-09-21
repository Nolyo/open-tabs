import { useState } from 'react'

export interface ImportExportData {
  tabs: any[]
  groups: any[]
  version: string
  exportedAt: string
}

export interface UseImportExportReturn {
  exportData: () => Promise<void>
  importData: (file: File) => Promise<void>
  isExporting: boolean
  isImporting: boolean
  error: string | null
}

export function useImportExport(): UseImportExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_DATA',
      })

      const data: ImportExportData = {
        tabs: response.tabs || [],
        groups: response.groups || [],
        version: '1.0',
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `open-tabs-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Erreur lors de l&apos;exportation des données')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const importData = async (file: File) => {
    setIsImporting(true)
    setError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.tabs || !data.groups) {
        throw new Error('Format de fichier invalide')
      }

      await chrome.runtime.sendMessage({
        type: 'IMPORT_DATA',
        payload: data,
      })
    } catch (err) {
      setError('Erreur lors de l&apos;importation des données')
      console.error('Import error:', err)
    } finally {
      setIsImporting(false)
    }
  }

  return {
    exportData,
    importData,
    isExporting,
    isImporting,
    error,
  }
}