import React, { useRef } from 'react'
import { useImportExport } from '~/hooks'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { notificationService } from '~/hooks/services'

export function ImportExportManager() {
  const {
    exportData,
    importData,
    isExporting,
    isImporting,
    error,
  } = useImportExport()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportClick = async () => {
    try {
      await exportData()
    } catch (error) {
      notificationService.error('Export', 'Échec de l&apos;exportation des données')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importData(file)
      notificationService.success('Import', 'Données importées avec succès')
      event.target.value = ''
    } catch (error) {
      notificationService.error('Import', 'Échec de l&apos;importation des données')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Import / Export</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Exporter les données</h3>
          <p className="text-sm text-gray-600">
            Exportez tous vos onglets et groupes dans un fichier JSON pour les sauvegarder.
          </p>
          <Button
            onClick={handleExportClick}
            disabled={isExporting}
            icon={
              isExporting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )
            }
          >
            {isExporting ? 'Exportation...' : 'Exporter les données'}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Importer les données</h3>
          <p className="text-sm text-gray-600">
            Importez un fichier JSON précédemment exporté pour restaurer vos onglets et groupes.
          </p>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={isImporting}
              icon={
                isImporting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )
              }
            >
              {isImporting ? 'Importation...' : 'Importer un fichier'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Information</h4>
        <p className="text-sm text-blue-800">
          L&apos;importation remplacera toutes vos données actuelles. Assurez-vous d&apos;avoir une sauvegarde avant d&apos;importer.
        </p>
      </div>
    </div>
  )
}