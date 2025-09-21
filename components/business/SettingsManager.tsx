import React, { useState } from 'react'
import { useStorage } from '~/hooks'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { Modal } from '~/components/ui/Modal'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { notificationService } from '~/hooks/services'

interface Settings {
  theme: 'light' | 'dark'
  notifications: boolean
  autoSave: boolean
  compactMode: boolean
  showTabCount: boolean
  showGroupColors: boolean
  confirmOnClose: boolean
}

export function SettingsManager() {
  const [settings, setSettings] = useStorage<Settings>('open-tabs-settings', {
    theme: 'light',
    notifications: true,
    autoSave: true,
    compactMode: false,
    showTabCount: true,
    showGroupColors: true,
    confirmOnClose: true,
  })

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleResetSettings = async () => {
    setIsResetting(true)
    try {
      const defaultSettings: Settings = {
        theme: 'light',
        notifications: true,
        autoSave: true,
        compactMode: false,
        showTabCount: true,
        showGroupColors: true,
        confirmOnClose: true,
      }
      setSettings(defaultSettings)
      setIsResetModalOpen(false)
      notificationService.success('Paramètres', 'Paramètres réinitialisés avec succès')
    } catch (error) {
      notificationService.error('Paramètres', 'Échec de la réinitialisation')
    } finally {
      setIsResetting(false)
    }
  }

  const settingGroups = [
    {
      title: 'Apparence',
      settings: [
        {
          key: 'theme' as const,
          label: 'Thème',
          type: 'select',
          options: [
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ],
        },
        {
          key: 'compactMode' as const,
          label: 'Mode compact',
          type: 'toggle',
        },
        {
          key: 'showGroupColors' as const,
          label: 'Afficher les couleurs des groupes',
          type: 'toggle',
        },
      ],
    },
    {
      title: 'Fonctionnalités',
      settings: [
        {
          key: 'showTabCount' as const,
          label: 'Afficher le nombre d&apos;onglets',
          type: 'toggle',
        },
        {
          key: 'confirmOnClose' as const,
          label: 'Confirmer la fermeture des onglets',
          type: 'toggle',
        },
        {
          key: 'autoSave' as const,
          label: 'Sauvegarde automatique',
          type: 'toggle',
        },
      ],
    },
    {
      title: 'Notifications',
      settings: [
        {
          key: 'notifications' as const,
          label: 'Activer les notifications',
          type: 'toggle',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Paramètres</h2>
        <Button
          variant="outline"
          onClick={() => setIsResetModalOpen(true)}
        >
          Réinitialiser
        </Button>
      </div>

      <div className="space-y-8">
        {settingGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              {group.title}
            </h3>
            <div className="space-y-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700">
                      {setting.label}
                    </label>
                  </div>
                  <div className="flex-shrink-0">
                    {setting.type === 'toggle' && (
                      <button
                        onClick={() => handleSettingChange(setting.key, !settings[setting.key])}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${settings[setting.key] ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${settings[setting.key] ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    )}
                    {setting.type === 'select' && (
                      <select
                        value={settings[setting.key]}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        {setting.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Réinitialiser les paramètres"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir réinitialiser tous les paramètres à leurs valeurs par défaut ?
            Cette action ne peut être annulée.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleResetSettings}
              disabled={isResetting}
              variant="danger"
            >
              {isResetting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}