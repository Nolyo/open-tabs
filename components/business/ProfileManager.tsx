import React, { useEffect, useMemo, useState } from 'react'
import type { Profile, ProfileSummary } from '~/types'
import { useProfiles } from '~/hooks/useProfiles'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { Modal } from '~/components/ui/Modal'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { notificationService } from '~/hooks/services'

const MAX_GROUPS_PREVIEW = 3

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return value
  }
}

export function ProfileManager() {
  const {
    profiles,
    summaries,
    snapshot,
    isLoading,
    isCapturing,
    isSaving,
    isDeleting,
    isOpening,
    error,
    captureCurrentState,
    saveProfile,
    deleteProfile,
    openProfile,
    clearError,
    setSnapshot,
  } = useProfiles()

  const [profileName, setProfileName] = useState('')
  const [profileDescription, setProfileDescription] = useState('')
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)

  const defaultProfileName = useMemo(() => {
    return new Date().toLocaleString()
  }, [snapshot?.meta?.tabCount])

  
  const handleCapture = async () => {
    const result = await captureCurrentState()
    if (!result) return

    setProfileName(defaultProfileName)
    setProfileDescription('')
    notificationService.info('Capture réalisée', `Groupes détectés: ${result.meta.groupCount}`)
  }

  const handlePrepareUpdate = (profile: Profile, captureFreshState = false) => {
    if (captureFreshState) {
      captureCurrentState().then(currentSnapshot => {
        if (!currentSnapshot) return
        notificationService.info('Capture prête', 'La sauvegarde écrasera ce profil')
      })
      return
    }

    setSnapshot({
      groups: profile.groups,
      meta: {
        groupCount: profile.groups.length,
        tabCount: profile.groups.reduce((total, group) => total + group.tabs.length, 0),
      },
    })
    setProfileName(profile.name)
    setProfileDescription(profile.description || '')
  }

  const handleSaveProfile = async () => {
    if (!snapshot || snapshot.meta.tabCount === 0) {
      notificationService.warning('Aucun onglet à enregistrer', 'Capturez une session contenant des onglets avant d\'enregistrer un profil.')
      return
    }

    const name = profileName.trim()
    if (!name) {
      notificationService.warning('Nom requis', 'Veuillez saisir un nom pour le profil.')
      return
    }

    try {
      await saveProfile({
        profileId: undefined,
        name,
        description: profileDescription.trim() || undefined,
        groups: snapshot.groups,
      })

      notificationService.success(
        'Profil enregistré',
        'Nouveau profil créé.'
      )

      setProfileName('')
      setProfileDescription('')
    } catch (saveError) {
      console.error('Erreur lors de la sauvegarde du profil:', saveError)
    }
  }

  
  const handleOpenProfile = async (profileId: string, options?: { openInNewWindow?: boolean }) => {
    try {
      await openProfile(profileId, options)
      notificationService.success('Profils restaurés', options?.openInNewWindow ? 'Une nouvelle fenêtre a été ouverte.' : 'Les onglets ont été restaurés dans la fenêtre courante.')
    } catch (openError) {
      console.error('Erreur ouverture profil:', openError)
    }
  }

  const totalProfiles = summaries.length
  const totalTabsAcrossProfiles = useMemo(
    () => summaries.reduce((total, summary) => total + summary.tabCount, 0),
    [summaries]
  )

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="text-right text-xs text-gray-500" style={{ color: 'var(--text-tertiary)' }}>
          <p>{totalProfiles} profil{totalProfiles > 1 ? 's' : ''}</p>
          <p>{totalTabsAcrossProfiles} onglet{totalTabsAcrossProfiles > 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-3 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
          >
            Ok
          </button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Sauvegarde express</h3>
            <p className="text-xs text-gray-500">Capturez toutes les fenêtres et regroupez-les dans un profil.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCapture}
            isLoading={isCapturing}
          >
            Capturer la session
          </Button>
        </div>

        {snapshot && (
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
              <p className="font-medium">Capture prête</p>
              <p>{snapshot.meta.groupCount} groupe{snapshot.meta.groupCount > 1 ? 's' : ''} / {snapshot.meta.tabCount} onglet{snapshot.meta.tabCount > 1 ? 's' : ''}</p>
              {snapshot.groups.slice(0, MAX_GROUPS_PREVIEW).map(group => (
                <div key={group.id} className="mt-1 flex items-center justify-between">
                  <span className="font-medium text-blue-900">{group.title}</span>
                  <span className="text-blue-700">{group.tabs.length} onglet{group.tabs.length > 1 ? 's' : ''}</span>
                </div>
              ))}
              {snapshot.groups.length > MAX_GROUPS_PREVIEW && (
                <p className="mt-1 italic">+ {snapshot.groups.length - MAX_GROUPS_PREVIEW} autres groupes</p>
              )}
            </div>

            <div className="grid gap-3">
              <Input
                label="Nom du profil"
                value={profileName}
                onChange={event => setProfileName(event.target.value)}
                placeholder="Ex: Projet client, Routines matin, Recherche..."
              />

              <Input
                label="Description (optionnel)"
                value={profileDescription}
                onChange={event => setProfileDescription(event.target.value)}
                placeholder="Notes, contexte ou objectif de cette session"
              />

            </div>

            <div className="flex items-center justify-between">
              <button
                className="text-xs text-gray-500 underline hover:text-gray-700"
                onClick={() => setSnapshot(null)}
              >
                Annuler la capture
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                >
                  Enregistrer maintenant
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Profils enregistrés</span>
          <span>{summaries.length} profil{summaries.length > 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
        ) : summaries.length === 0 ? (
          <div className="px-4 py-5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Aucun profil enregistré pour le moment. Capturez vos onglets pour créer votre première sauvegarde.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100" style={{ borderColor: 'var(--border-primary)' }}>
            {summaries.map(summary => {
              const profile = profiles.find(item => item.id === summary.id)
              const isExpanded = expandedProfileId === summary.id

              return (
                <li key={summary.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedProfileId(isExpanded ? null : summary.id)}
                          className="rounded-full border border-gray-200 p-1 text-gray-500 hover:bg-gray-100"
                          title={isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                        >
                          <svg className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h3 className="text-sm font-semibold text-gray-900">{summary.name}</h3>
                      </div>
                      {summary.description && (
                        <p className="mt-1 text-xs text-gray-500">{summary.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{summary.groupCount} groupe{summary.groupCount > 1 ? 's' : ''}</span>
                        <span>{summary.tabCount} onglet{summary.tabCount > 1 ? 's' : ''}</span>
                        <span>MàJ {formatDateTime(summary.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenProfile(summary.id)}
                        isLoading={isOpening}
                        className="min-w-[80px]"
                      >
                        Ouvrir
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenProfile(summary.id, { openInNewWindow: true })}
                          isLoading={isOpening}
                          title="Ouvrir dans une nouvelle fenêtre"
                        >
                          🪟
                        </Button>
                        {profile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrepareUpdate(profile, false)}
                            disabled={isSaving || isCapturing}
                            title="Modifier le profil"
                          >
                            ✏️
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const profile = profiles.find(item => item.id === summary.id)
                            if (!profile) return
                            handlePrepareUpdate(profile, true)
                          }}
                          disabled={isCapturing}
                          title="Actualiser depuis le navigateur"
                        >
                          🔄
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            await deleteProfile(summary.id)
                            notificationService.success('Profil supprimé', `Le profil "${summary.name}" a été supprimé.`)
                          }}
                          disabled={isDeleting}
                          title="Supprimer le profil"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && profile && (
                    <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                      {profile.groups.slice(0, MAX_GROUPS_PREVIEW).map(group => (
                        <div key={group.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: group.color || '#4A90E2' }}
                            />
                            <span className="font-medium text-gray-800">{group.title}</span>
                          </div>
                          <span>{group.tabs.length} onglet{group.tabs.length > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                      {profile.groups.length > MAX_GROUPS_PREVIEW && (
                        <p className="italic text-gray-500">
                          + {profile.groups.length - MAX_GROUPS_PREVIEW} groupes supplémentaires
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      </section>
  )
}
