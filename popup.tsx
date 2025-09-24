import { useEffect, useMemo, useState } from 'react'
import { Storage } from '@plasmohq/storage'

import {
  PopupContainer,
  PopupHeader,
  PopupContent,
  PopupFooter,
} from '~/components/Popup'
import { NotificationManager } from '~/components/business'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { Modal } from '~/components/ui/Modal'
import { SearchBar } from '~/components/ui/SearchBar'
import { notificationService } from '~/hooks/services'
import { useProfiles } from '~/hooks/useProfiles'
import { useStorage } from '~/hooks/useStorage'
import { useTheme } from '~/hooks/useTheme'
import type { ProfileSummary, TabGroup } from '~/types'

import './options.css'
import './style.css'

type OpenTab = {
  id: number
  url: string
  title: string
  favicon?: string
}

type ContextMenuPayload = {
  url: string
  title: string
}

const storage = new Storage()

const GROUP_COLOR_OPTIONS = [
  '#808080',
  '#4285f4',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#ff6b9d',
  '#9c27b0',
  '#00bcd4',
  '#ff9800',
] as const

function IndexPopup() {
  const {
    groups,
    loading: areGroupsLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    addUrlToGroup,
    removeUrlFromGroup,
  } = useStorage()
  const {
    summaries,
    profiles,
    snapshot,
    isLoading: areProfilesLoading,
    isCapturing,
    isSaving,
    isOpening,
    isDeleting,
    error: profilesError,
    captureCurrentState,
    saveProfile,
    deleteProfile,
    openProfile,
    clearError,
    setSnapshot,
  } = useProfiles()
  const { theme, toggleTheme } = useTheme()

  const [groupSearchTerm, setGroupSearchTerm] = useState('')
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileDescription, setProfileDescription] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [profileToDelete, setProfileToDelete] = useState<ProfileSummary | null>(null)

  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [groupDraft, setGroupDraft] = useState<{ id?: string; name: string; color: string }>(
    { name: '', color: GROUP_COLOR_OPTIONS[1] }
  )
  const [showImportExportModal, setShowImportExportModal] = useState(false)
  const [showOpenTabsModal, setShowOpenTabsModal] = useState(false)
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([])
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set())
  const [loadingTabs, setLoadingTabs] = useState(false)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [contextMenuData, setContextMenuData] = useState<ContextMenuPayload | null>(null)
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'profiles' | 'groups'>('profiles')

  useEffect(() => {
    const readContextPayload = async () => {
      try {
        const data = await storage.get<ContextMenuPayload>('contextMenuData')
        if (data) {
          setContextMenuData(data)
          setShowGroupSelectModal(true)
          await storage.remove('contextMenuData')
        }
      } catch (error) {
        console.error('Erreur de lecture du contexte menu:', error)
      }
    }

    readContextPayload()
  }, [])

  useEffect(() => {
    if (!showOpenTabsModal) {
      setOpenTabs([])
      setSelectedTabs(new Set())
      return
    }

    const loadTabs = async () => {
      setLoadingTabs(true)
      try {
        const tabs = await chrome.tabs.query({ currentWindow: true })
        const validTabs = tabs
          .filter(
            (tab) =>
              Boolean(tab.url) &&
              !tab.url!.startsWith('chrome://') &&
              !tab.url!.startsWith('chrome-extension://')
          )
          .map((tab) => ({
            id: tab.id!,
            url: tab.url!,
            title: tab.title || 'Sans titre',
            favicon: tab.favIconUrl || undefined,
          }))
        setOpenTabs(validTabs)
      } catch (error) {
        console.error('Erreur lors du chargement des onglets ouverts:', error)
        notificationService.error('Erreur', "Impossible de charger les onglets ouverts")
      } finally {
        setLoadingTabs(false)
      }
    }

    loadTabs()
  }, [showOpenTabsModal])

  const filteredGroups = useMemo(() => {
    if (!groupSearchTerm) {
      return groups
    }

    const term = groupSearchTerm.toLowerCase()
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(term) ||
        group.urls.some((url) => url.url.toLowerCase().includes(term))
    )
  }, [groupSearchTerm, groups])

  const toggleTabSelection = (tabId: number) => {
    setSelectedTabs((prev) => {
      const next = new Set(prev)
      if (next.has(tabId)) {
        next.delete(tabId)
      } else {
        next.add(tabId)
      }
      return next
    })
  }

  const selectAllTabs = () => {
    setSelectedTabs(new Set(openTabs.map((tab) => tab.id)))
  }

  const clearTabSelection = () => {
    setSelectedTabs(new Set())
  }

  const handleQuickCapture = async () => {
    const result = await captureCurrentState()
    if (!result) {
      return
    }

    const defaultName = `Session du ${new Date().toLocaleString('fr-FR')}`
    setProfileName(defaultName)
    setProfileDescription('')
    setSelectedProfileId(null)
    setShowSaveProfileModal(true)
    notificationService.info(
      'Capture prête',
      `${result.meta.groupCount} groupe(s) détecté(s)`
    )
  }

  const handleSaveProfile = async () => {
    if (!snapshot) {
      notificationService.warning(
        'Aucune capture',
        'Capturez la session courante avant de sauvegarder.'
      )
      return
    }

    const name = profileName.trim()
    if (!name) {
      notificationService.warning('Nom requis', 'Donnez un nom à votre profil.')
      return
    }

    try {
      await saveProfile({
        profileId: selectedProfileId ?? undefined,
        name,
        description: profileDescription.trim() || undefined,
        groups: snapshot.groups,
      })
      notificationService.success(
        'Profil enregistré',
        selectedProfileId ? 'Profil mis à jour' : 'Nouveau profil créé'
      )
      setShowSaveProfileModal(false)
      setProfileName('')
      setProfileDescription('')
      setSelectedProfileId(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error)
      notificationService.error('Erreur', "Impossible d'enregistrer le profil")
    }
  }

  const handleOpenProfile = async (profileId: string, openInNewWindow = false) => {
    try {
      await openProfile(profileId, { openInNewWindow })
      window.close()
    } catch (error) {
      console.error("Erreur lors de l'ouverture du profil:", error)
      notificationService.error('Erreur', "Impossible d'ouvrir le profil")
    }
  }

  const handleReplaceProfile = async (profile: ProfileSummary) => {
    const result = await captureCurrentState()
    if (!result) {
      return
    }

    const fullProfile = profiles.find((item) => item.id === profile.id)
    if (fullProfile) {
      setProfileName(fullProfile.name)
      setProfileDescription(fullProfile.description ?? '')
    } else {
      setProfileName(profile.name)
      setProfileDescription(profile.description ?? '')
    }
    setSelectedProfileId(profile.id)
    setShowSaveProfileModal(true)
    notificationService.info(
      'Capture prête',
      'La sauvegarde remplacera le profil sélectionné.'
    )
  }

  const handleDeleteProfile = async () => {
    if (!profileToDelete) {
      return
    }

    try {
      await deleteProfile(profileToDelete.id)
      notificationService.success(
        'Profil supprimé',
        `Le profil "${profileToDelete.name}" a été supprimé.`
      )
      setProfileToDelete(null)
    } catch (error) {
      console.error('Erreur suppression profil:', error)
      notificationService.error('Erreur', 'Impossible de supprimer ce profil')
    }
  }

  const handleCreateGroup = async () => {
    const name = groupDraft.name.trim()
    if (!name) {
      notificationService.warning('Nom requis', 'Indiquez un nom de groupe.')
      return
    }

    try {
      await createGroup(name, groupDraft.color)
      notificationService.success('Groupe créé', `"${name}" est prêt.`)
      setShowAddGroupModal(false)
      setGroupDraft({ name: '', color: groupDraft.color })
    } catch (error) {
      console.error('Erreur création groupe:', error)
      notificationService.error('Erreur', 'Impossible de créer le groupe')
    }
  }

  const handleEditGroup = (group: TabGroup) => {
    setGroupDraft({ id: group.id, name: group.name, color: group.color })
    setShowEditGroupModal(true)
  }

  const handlePersistGroupEdition = async () => {
    if (!groupDraft.id) {
      return
    }

    const name = groupDraft.name.trim()
    if (!name) {
      notificationService.warning('Nom requis', 'Indiquez un nom de groupe.')
      return
    }

    try {
      await updateGroup(groupDraft.id, { name, color: groupDraft.color })
      notificationService.success('Groupe mis à jour', `"${name}" a été actualisé.`)
      setShowEditGroupModal(false)
      setGroupDraft({ name: '', color: GROUP_COLOR_OPTIONS[1] })
    } catch (error) {
      console.error('Erreur mise à jour groupe:', error)
      notificationService.error('Erreur', 'Impossible de mettre à jour le groupe')
    }
  }

  const handleRemoveGroup = async (groupId: string) => {
    const group = groups.find((item) => item.id === groupId)
    if (!group) {
      return
    }

    const confirmed = window.confirm(
      `Supprimer le groupe "${group.name}" ? Cette action est irréversible.`
    )
    if (!confirmed) {
      return
    }

    try {
      await deleteGroup(groupId)
      notificationService.success('Groupe supprimé', `"${group.name}" a été supprimé.`)
    } catch (error) {
      console.error('Erreur suppression groupe:', error)
      notificationService.error('Erreur', 'Impossible de supprimer ce groupe')
    }
  }

  const handleAddCurrentTabToGroup = async (groupId: string) => {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!currentTab?.url) {
        notificationService.warning(
          'Onglet indisponible',
          "Impossible de récupérer l'onglet actif"
        )
        return
      }

      await addUrlToGroup(groupId, currentTab.url, currentTab.title)
      notificationService.success('Onglet ajouté', "L'onglet actif a été enregistré")
    } catch (error) {
      if (error instanceof Error && error.message === 'Cette URL existe déjà dans ce groupe') {
        notificationService.info('Déjà présent', 'Cette page existe déjà dans le groupe')
      } else {
        console.error('Erreur ajout onglet groupe:', error)
        notificationService.error('Erreur', "Impossible d'ajouter l'onglet")
      }
    }
  }

  const handleRemoveUrlFromGroup = async (groupId: string, urlId: string) => {
    try {
      await removeUrlFromGroup(groupId, urlId)
      notificationService.success('Lien retiré', "L'URL a été supprimée du groupe")
    } catch (error) {
      console.error('Erreur suppression URL:', error)
      notificationService.error('Erreur', "Impossible de supprimer l'URL du groupe")
    }
  }

  const handleAddSelectedTabsToGroup = async (groupId: string) => {
    if (selectedTabs.size === 0) {
      notificationService.info('Aucun onglet', 'Sélectionnez des onglets à enregistrer')
      return
    }

    try {
      const tabsToAdd = openTabs.filter((tab) => selectedTabs.has(tab.id))
      let added = 0
      let duplicates = 0

      for (const tab of tabsToAdd) {
        try {
          await addUrlToGroup(groupId, tab.url, tab.title)
          added += 1
        } catch (error) {
          if (error instanceof Error && error.message === 'Cette URL existe déjà dans ce groupe') {
            duplicates += 1
          }
        }
      }

      const baseMessage = `${added} onglet(s) enregistré(s)`
      notificationService.success(
        'Enregistrement terminé',
        duplicates > 0 ? `${baseMessage} (${duplicates} déjà présents)` : baseMessage
      )

      setSelectedTabs(new Set())
      setShowOpenTabsModal(false)
    } catch (error) {
      console.error('Erreur ajout onglets sélectionnés:', error)
      notificationService.error('Erreur', "Impossible d'ajouter les onglets sélectionnés")
    }
  }

  const handleImportBookmarks = async () => {
    try {
      const bookmarks = await chrome.bookmarks.getTree()
      const bookmarkBar = bookmarks[0].children?.find((child) => child.title === 'Bookmarks Bar' || child.title === 'Barre de favoris')

      if (!bookmarkBar?.children) {
        notificationService.warning('Aucun favori', 'Aucun dossier de favoris à importer')
        return
      }

      for (const folder of bookmarkBar.children) {
        if (!folder.children || folder.children.length === 0) {
          continue
        }

        const color = GROUP_COLOR_OPTIONS[Math.floor(Math.random() * GROUP_COLOR_OPTIONS.length)]
        const newGroup = await createGroup(folder.title, color)

        for (const bookmark of folder.children) {
          if (!bookmark.url || bookmark.url.startsWith('javascript:')) {
            continue
          }

          try {
            await addUrlToGroup(newGroup.id, bookmark.url, bookmark.title)
          } catch (error) {
            if (!(error instanceof Error && error.message === 'Cette URL existe déjà dans ce groupe')) {
              console.error('Erreur import URL favori:', error)
            }
          }
        }
      }

      notificationService.success('Import terminé', 'Les favoris ont été importés')
      setShowImportExportModal(false)
    } catch (error) {
      console.error('Erreur import favoris:', error)
      notificationService.error('Erreur', "Impossible d'importer les favoris")
    }
  }

  const handleExportData = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'EXPORT_DATA',
      })

      const data = {
        groups: response.groups || [],
        profiles: response.profiles || [],
        settings: response.settings || {},
        version: '1.1',
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `open-tabs-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      notificationService.success('Export réussi', 'Votre sauvegarde JSON est prête')
    } catch (error) {
      console.error('Erreur export JSON:', error)
      notificationService.error('Erreur', "Impossible d'exporter les données")
    }
  }

  const handleImportData = async (file: File) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Valider les données
      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error('Format de fichier invalide: groupes manquants')
      }

      // Valider les profils si présents
      if (data.profiles && !Array.isArray(data.profiles)) {
        throw new Error('Format de fichier invalide: profils incorrects')
      }

      const response = await chrome.runtime.sendMessage({
        action: 'IMPORT_DATA',
        payload: data,
      })

      if (response && response.error) {
        throw new Error(response.error)
      }

      notificationService.success(
        'Import réussi',
        `${response.importedGroups} groupe(s) et ${response.importedProfiles || 0} profil(s) importé(s)`
      )
      setImportFile(null)
      setShowImportExportModal(false)
    } catch (error) {
      console.error('Erreur import JSON:', error)
      notificationService.error('Erreur', error instanceof Error ? error.message : "Impossible d'importer les données")
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddFromContextMenu = async (groupId: string) => {
    if (!contextMenuData) {
      return
    }

    try {
      await addUrlToGroup(groupId, contextMenuData.url, contextMenuData.title)
      notificationService.success('URL ajoutée', 'Le lien a été enregistré dans le groupe')
      setContextMenuData(null)
      setShowGroupSelectModal(false)
    } catch (error) {
      if (error instanceof Error && error.message === 'Cette URL existe déjà dans ce groupe') {
        notificationService.info('Déjà présent', 'Ce lien était déjà enregistré')
      } else {
        console.error('Erreur ajout URL depuis menu contextuel:', error)
        notificationService.error('Erreur', "Impossible d'ajouter le lien")
      }
    }
  }

  const handleOpenGroup = async (groupId: string) => {
    try {
      await chrome.runtime.sendMessage({ action: 'openTabGroup', groupId })
      window.close()
    } catch (error) {
      console.error("Erreur lors de l'ouverture du groupe:", error)
      notificationService.error('Erreur', "Impossible d'ouvrir ce groupe")
    }
  }

  const handleOpenAllGroups = async () => {
    for (const group of groups) {
      try {
        await chrome.runtime.sendMessage({ action: 'openTabGroup', groupId: group.id })
      } catch (error) {
        console.error('Erreur ouverture groupe multiple:', error)
      }
    }
    window.close()
  }

  return (
    <PopupContainer className="w-[384px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <NotificationManager />

      <PopupHeader
        showCloseButton={false}
        className="bg-gradient-to-br from-indigo-600 via-sky-600 to-cyan-600 text-white"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/30 border border-white/20 backdrop-blur-sm"
              onClick={toggleTheme}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/30 border border-white/20 backdrop-blur-sm"
              onClick={() => chrome.runtime.openOptionsPage?.()}
            >
              ⚙️
            </Button>
          </div>
        }
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-white/70">Open Tabs</p>
          <h1 className="text-lg font-semibold">Vos profils en un clin d'œil</h1>
          <p className="text-xs text-white/80">
            Capturez, restaurez et organisez vos sessions de navigation.
          </p>
        </div>
      </PopupHeader>

      <PopupContent className="flex-1 overflow-y-auto p-4 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {profilesError && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{profilesError}</span>
            <button
              onClick={clearError}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
            >
              OK
            </button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            style={{
              color: activeTab === 'profiles' ? '#2563eb' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'profiles' ? '#eff6ff' : 'transparent'
            }}
            onClick={() => setActiveTab('profiles')}
          >
            Profils
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            style={{
              color: activeTab === 'groups' ? '#2563eb' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'groups' ? '#eff6ff' : 'transparent'
            }}
            onClick={() => setActiveTab('groups')}
          >
            Groupes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profiles' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 justify-start gap-2 border"
                onClick={handleQuickCapture}
                isLoading={isCapturing}
                style={{
                  backgroundColor: '#8b5cf6',
                  borderColor: '#7c3aed',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                📸 Capturer la session
              </Button>
              {/*
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 border"
                onClick={() => setShowImportExportModal(true)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >
                📁 Import / Export
              </Button>
              */}
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Profils enregistrés</h2>
                {summaries.length > 1 && (
                  <button
                    className="text-xs underline"
                    style={{ color: 'var(--text-tertiary)' }}
                    onClick={handleOpenAllGroups}
                  >
                    Ouvrir tous les groupes
                  </button>
                )}
              </div>

              {areProfilesLoading ? (
                <div className="flex items-center justify-center rounded-xl border py-6" style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}>
                  <LoadingSpinner size="sm" />
                </div>
              ) : summaries.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm" style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-tertiary)'
                }}>
                  Capturez votre première session pour créer un profil.
                </div>
              ) : (
                <div className="space-y-3">
                  {summaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="rounded-xl border p-4 shadow-sm"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{summary.name}</h3>
                            <span className="rounded-full px-2 py-0.5 text-[11px]" style={{
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)'
                            }}>
                              {summary.tabCount} onglet(s)
                            </span>
                          </div>
                          {summary.description && (
                            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{summary.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span>{summary.groupCount} groupe(s)</span>
                            <span>MàJ {new Date(summary.updatedAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenProfile(summary.id)}
                            isLoading={isOpening}
                            style={{
                              backgroundColor: '#10b981',
                              borderColor: '#059669',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="border hover:bg-green-600"
                          >
                            Ouvrir ici
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenProfile(summary.id, true)}
                            isLoading={isOpening}
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              borderColor: 'var(--border-primary)',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="border hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            Nouvelle fenêtre
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => handleReplaceProfile(summary)}
                            disabled={isCapturing}
                          >
                            Actualiser avec la session courante
                          </button>
                          <button
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => setProfileToDelete(summary)}
                            disabled={isDeleting}
                          >
                            Supprimer
                          </button>
                        </div>
                        <button
                          className="text-slate-400 hover:text-slate-600"
                          onClick={() => setExpandedGroupId((prev) => (prev === summary.id ? null : summary.id))}
                        >
                          {expandedGroupId === summary.id ? 'Masquer' : 'Détails'}
                        </button>
                      </div>

                      {expandedGroupId === summary.id && (
                        <div className="mt-3 rounded-lg border p-3 text-xs" style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-tertiary)'
                        }}>
                          {profiles
                            .find((profile) => profile.id === summary.id)?.groups.slice(0, 4)
                            .map((group) => (
                              <div key={group.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: group.color || '#4A90E2' }}
                                  />
                                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{group.title}</span>
                                </div>
                                <span style={{ color: 'var(--text-tertiary)' }}>{group.tabs.length} onglet(s)</span>
                              </div>
                            ))}
                          {profiles.find((profile) => profile.id === summary.id)?.groups.length! > 4 && (
                            <p className="mt-2 italic" style={{ color: 'var(--text-tertiary)' }}>
                              + {profiles.find((profile) => profile.id === summary.id)?.groups.length! - 4} autres groupes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 justify-start gap-2 border"
                onClick={() => setShowOpenTabsModal(true)}
                style={{
                  backgroundColor: '#f59e0b',
                  borderColor: '#d97706',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'white'
                }}
              >
                ➕ Ajouter des onglets
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 border"
                onClick={() => setShowAddGroupModal(true)}
                style={{
                  backgroundColor: '#06b6d4',
                  borderColor: '#0891b2',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'white'
                }}
              >
                ✨ Nouveau groupe
              </Button>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Groupes enregistrés</h2>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{groups.length} groupe(s)</span>
              </div>

          <SearchBar
            value={groupSearchTerm}
            onChange={setGroupSearchTerm}
            onClear={() => setGroupSearchTerm('')}
            placeholder="Rechercher un groupe ou une URL"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          />

          {areGroupsLoading ? (
            <div className="flex items-center justify-center rounded-xl border py-6" style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)'
            }}>
              <LoadingSpinner size="sm" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm" style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-tertiary)'
            }}>
              Aucun groupe ne correspond à votre recherche.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const isExpanded = expandedGroupId === group.id
                return (
                  <div
                    key={group.id}
                    className="rounded-xl border p-4 shadow-sm"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.name}</p>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {group.urls.length} lien(s) sauvegardé(s)
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddCurrentTabToGroup(group.id)}
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-primary)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                          className="border"
                        >
                          + Onglet actif
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenGroup(group.id)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderColor: '#2563eb',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                          className="border hover:bg-blue-600"
                        >
                          Ouvrir
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          className="hover:text-slate-700"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                        >
                          {isExpanded ? 'Masquer les liens' : 'Voir les liens'}
                        </button>
                        <button
                          className="hover:text-slate-600"
                          style={{ color: 'var(--text-tertiary)' }}
                          onClick={() => handleEditGroup(group)}
                        >
                          Renommer / couleur
                        </button>
                        <button
                          className="hover:text-red-500"
                          style={{ color: 'var(--text-tertiary)' }}
                          onClick={() => handleRemoveGroup(group.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                      <button
                        className="hover:text-slate-600"
                        style={{ color: 'var(--text-tertiary)' }}
                        onClick={() => setShowOpenTabsModal(true)}
                      >
                        Ajouter des onglets…
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 rounded-lg border p-3 text-xs" style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-tertiary)'
                        }}>
                        {group.urls.slice(0, 5).map((url) => (
                          <div key={url.id} className="flex items-start justify-between gap-2">
                            <div>
                              <p style={{ color: 'var(--text-primary)' }}>{url.title || 'Sans titre'}</p>
                              <p className="break-all text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{url.url}</p>
                            </div>
                            <button
                              className="hover:text-red-500"
                              style={{ color: 'var(--text-tertiary)' }}
                              onClick={() => handleRemoveUrlFromGroup(group.id, url.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        ))}
                        {group.urls.length > 5 && (
                          <p className="italic" style={{ color: 'var(--text-tertiary)' }}>
                            + {group.urls.length - 5} lien(s) supplémentaire(s)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )}
      </PopupContent>

      <PopupFooter
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
        actions={<span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{groups.length} groupe(s)</span>}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{summaries.length} profil(s)</span>
      </PopupFooter>

      <Modal
        isOpen={showSaveProfileModal}
        onClose={() => setShowSaveProfileModal(false)}
        title={selectedProfileId ? 'Mettre à jour le profil' : 'Nouveau profil'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ajoutez un titre et un contexte pour retrouver vos sessions plus facilement.
          </p>

          <Input
            label="Nom du profil"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="Ex. Routine du matin, Projet client, Recherche…"
          />

          <Input
            label="Description (optionnelle)"
            value={profileDescription}
            onChange={(event) => setProfileDescription(event.target.value)}
            placeholder="Notes sur ce profil"
          />

          {summaries.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Écraser un profil existant</label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedProfileId ?? ''}
                onChange={(event) => {
                  const value = event.target.value || null
                  setSelectedProfileId(value)
                  if (!value) {
                    setProfileName('')
                    setProfileDescription('')
                    return
                  }
                  const profile = profiles.find((item) => item.id === value)
                  if (profile) {
                    setProfileName(profile.name)
                    setProfileDescription(profile.description ?? '')
                    setSnapshot({
                      groups: profile.groups,
                      meta: {
                        groupCount: profile.groups.length,
                        tabCount: profile.groups.reduce((total, group) => total + group.tabs.length, 0),
                      },
                    })
                  }
                }}
              >
                <option value="">Nouvelle sauvegarde</option>
                {summaries.map((summary) => (
                  <option key={summary.id} value={summary.id}>
                    {summary.name} ({summary.tabCount} onglet(s))
                  </option>
                ))}
              </select>
            </div>
          )}

          {snapshot && (
            <div className="rounded-lg border p-3 text-xs" style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-tertiary)'
            }}>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Capture en attente</p>
              <p>
                {snapshot.meta.groupCount} groupe(s) • {snapshot.meta.tabCount} onglet(s)
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSaveProfileModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveProfile} isLoading={isSaving}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(profileToDelete)}
        onClose={() => setProfileToDelete(null)}
        title="Supprimer le profil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Êtes-vous certain de vouloir supprimer le profil « {profileToDelete?.name} » ? Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProfileToDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteProfile} isLoading={isDeleting}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        title="Nouveau groupe"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom du groupe"
            value={groupDraft.name}
            onChange={(event) => setGroupDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Nom du groupe"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Couleur</p>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  className={`h-8 w-8 rounded-full border-2 ${groupDraft.color === color ? 'border-slate-900' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setGroupDraft((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddGroupModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateGroup}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditGroupModal}
        onClose={() => setShowEditGroupModal(false)}
        title="Modifier le groupe"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom du groupe"
            value={groupDraft.name}
            onChange={(event) => setGroupDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Nom du groupe"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Couleur</p>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  className={`h-8 w-8 rounded-full border-2 ${groupDraft.color === color ? 'border-slate-900' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setGroupDraft((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowEditGroupModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handlePersistGroupEdition}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportExportModal}
        onClose={() => {
          setShowImportExportModal(false)
          setImportFile(null)
        }}
        title="Import & Export"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Sauvegardez toutes vos données ou importez une sauvegarde existante.
          </p>

          <div className="space-y-2">
            <Button variant="primary" size="sm" className="w-full" onClick={handleImportBookmarks}>
              📥 Importer la barre de favoris
            </Button>

            <div className="space-y-2">
              <input
                type="file"
                accept=".json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    setImportFile(file)
                  }
                }}
                className="hidden"
                id="import-json-file"
              />

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('import-json-file')?.click()}
              >
                📁 Choisir un fichier JSON
              </Button>

              {importFile && (
                <div className="rounded-lg p-3 text-xs" style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-tertiary)'
                }}>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Fichier sélectionné :</p>
                  <p className="truncate">{importFile.name}</p>
                  <p style={{ color: 'var(--text-tertiary)' }}>{(importFile.size / 1024).toFixed(1)} KB</p>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleImportData(importFile)}
                    disabled={!importFile || isImporting}
                    isLoading={isImporting}
                  >
                    📥 {isImporting ? 'Importation...' : 'Importer les données'}
                  </Button>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={handleExportData}>
              📤 Exporter en JSON
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => {
              setShowImportExportModal(false)
              setImportFile(null)
            }}>
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showOpenTabsModal}
        onClose={() => setShowOpenTabsModal(false)}
        title="Onglets ouverts"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllTabs}>
                Tout sélectionner
              </Button>
              <Button variant="ghost" size="sm" onClick={clearTabSelection}>
                Tout désélectionner
              </Button>
            </div>
            <span className="text-xs text-slate-500">
              {selectedTabs.size} onglet(s) sélectionné(s)
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border-primary)' }}>
            {loadingTabs ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : openTabs.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Aucun onglet détecté dans cette fenêtre.
              </div>
            ) : (
              <ul className="divide-y bg-white" style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}>
                {openTabs.map((tab) => {
                  const isSelected = selectedTabs.has(tab.id)
                  const isInGroup = groups.some((group) =>
                    group.urls.some((url) => url.url === tab.url)
                  )

                  return (
                    <li
                      key={tab.id}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${isSelected ? 'bg-indigo-50' : ''}`}
                      style={{
                        backgroundColor: isSelected ? '#eff6ff' : 'var(--bg-tertiary)'
                      }}
                      onClick={() => toggleTabSelection(tab.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTabSelection(tab.id)}
                        className="h-4 w-4"
                        onClick={(event) => event.stopPropagation()}
                      />
                      {tab.favicon && (
                        <img src={tab.favicon} alt="" className="h-4 w-4 rounded" />
                      )}
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{tab.title}</p>
                        <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{tab.url}</p>
                      </div>
                      {isInGroup && <span className="text-xs" style={{ color: '#16a34a' }}>Déjà enregistré</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {selectedTabs.size > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Ajouter à un groupe</p>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleAddSelectedTabsToGroup(group.id)}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    {group.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowOpenTabsModal(false)}>
              Fermer
            </Button>
            {groups.length === 0 && (
              <Button variant="primary" size="sm" onClick={() => {
                setShowOpenTabsModal(false)
                setShowAddGroupModal(true)
              }}>
                Créer un groupe
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showGroupSelectModal && Boolean(contextMenuData)}
        onClose={() => {
          setShowGroupSelectModal(false)
          setContextMenuData(null)
        }}
        title="Ajouter au groupe"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-xs" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-tertiary)'
          }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{contextMenuData?.title || 'Sans titre'}</p>
            <p className="break-all text-[11px]">{contextMenuData?.url}</p>
          </div>

          {groups.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aucun groupe disponible. Créez un groupe avant d'ajouter ce lien.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <Button
                  key={group.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-3"
                  onClick={() => handleAddFromContextMenu(group.id)}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                  <span className="text-xs text-slate-500">
                    {group.urls.length} lien(s)
                  </span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowGroupSelectModal(false)
                setContextMenuData(null)
              }}
            >
              Fermer
            </Button>
            {groups.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowGroupSelectModal(false)
                  setContextMenuData(null)
                  setShowAddGroupModal(true)
                }}
              >
                Créer un groupe
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </PopupContainer>
  )
}

export default IndexPopup
