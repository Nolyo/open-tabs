import { Storage } from '@plasmohq/storage'
import type {
  Profile,
  ProfileGroup,
  ProfileSummary,
  ProfileTab,
  TabGroup,
  TabUrl
} from './types'

const storage = new Storage()
const PROFILES_KEY = 'profiles'

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

// Initialisation du storage avec des données par défaut
const initializeStorage = async () => {
  const existingGroups = await storage.get<TabGroup[]>('groups')
  if (!existingGroups) {
    await storage.set('groups', [])
  }

  const existingProfiles = await storage.get<Profile[]>(PROFILES_KEY)
  if (!existingProfiles) {
    await storage.set(PROFILES_KEY, [])
  }

  const existingSettings = await storage.get('settings')
  if (!existingSettings) {
    await storage.set('settings', {
      theme: 'light',
      autoOpenNewTabs: false,
      defaultGroupColor: '#4285f4'
    })
  }
}

// Fonction pour ouvrir un groupe d'onglets
export const openTabGroup = async (groupId: string) => {
  const groups = await storage.get<TabGroup[]>('groups') || []
  const group = groups.find(g => g.id === groupId)

  if (!group) {
    throw new Error('Group not found')
  }

  // Créer les onglets
  const tabIds: number[] = []
  for (const urlData of group.urls) {
    const tab = await chrome.tabs.create({
      url: urlData.url,
      active: false
    })
    tabIds.push(tab.id)
  }

  // Regrouper les onglets
  const tabGroup = await chrome.tabs.group({
    tabIds,
    createProperties: {
      windowId: chrome.windows.WINDOW_ID_CURRENT
    }
  })

  // Mettre à jour le titre du groupe - Chrome attend des couleurs spécifiques
  const colorMap: { [key: string]: string } = {
    '#808080': 'grey',
    '#4285f4': 'blue',
    '#ea4335': 'red',
    '#fbbc04': 'yellow',
    '#34a853': 'green',
    '#ff6b9d': 'pink',
    '#9c27b0': 'purple',
    '#00bcd4': 'cyan',
    '#ff9800': 'orange'
  }
  const chromeColor = colorMap[group.color] || 'blue'

  await chrome.tabGroups.update(tabGroup, {
    title: group.name,
    color: chromeColor as any
  })

  return tabGroup
}

// Fonction pour ajouter un onglet courant à un groupe
export const addCurrentTabToGroup = async (groupId: string) => {
  // Obtenir l'onglet actif
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  })

  if (!currentTab || !currentTab.url) {
    throw new Error('No active tab found')
  }

  const groups = await storage.get<TabGroup[]>('groups') || []
  const group = groups.find(g => g.id === groupId)

  if (!group) {
    throw new Error('Group not found')
  }

  // Créer l'URL à ajouter
  const newUrl: TabUrl = {
    id: Date.now().toString(),
    url: currentTab.url,
    title: currentTab.title,
    favicon: currentTab.favIconUrl,
    groupId,
    order: group.urls.length
  }

  // Ajouter l'URL au groupe
  group.urls.push(newUrl)
  group.updatedAt = new Date()

  // Sauvegarder
  await storage.set('groups', groups)

  return newUrl
}

// Initialiser au démarrage
chrome.runtime.onInstalled.addListener(() => {
  initializeStorage()
  createContextMenus()
})

// Créer les menus contextuels
const createContextMenus = () => {
  // Menu pour ajouter la page actuelle à un groupe
  chrome.contextMenus.create({
    id: 'add-current-page-to-group',
    title: 'Ajouter cette page à un groupe',
    contexts: ['page', 'link', 'selection']
  })
}

// Gérer les clics sur les menus contextuels
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-current-page-to-group') {
    const url = info.linkUrl || tab.url
    const title = info.selectionText || tab.title || 'Sans titre'

    if (url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://')) {
      // Stocker les données pour la popup
      await storage.set('contextMenuData', { url, title })

      // Ouvrir la popup
      chrome.action.openPopup()
    }
  }
})


// Listener pour les messages du popup ou options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openTabGroup':
      openTabGroup(request.groupId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'addCurrentTabToGroup':
      addCurrentTabToGroup(request.groupId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'EXPORT_DATA':
      exportData()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'IMPORT_DATA':
      importData(request.payload)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'CAPTURE_CURRENT_STATE':
      captureCurrentState()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'SAVE_PROFILE':
      saveProfile(request.payload)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'GET_PROFILES':
      getProfiles()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'DELETE_PROFILE':
      deleteProfile(request.profileId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true

    case 'OPEN_PROFILE':
      openProfile(request.profileId, request.options)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }))
      return true
  }
})

// Fonction pour exporter les données
const exportData = async () => {
  const groups = await storage.get<TabGroup[]>('groups') || []
  const settings = await storage.get('settings') || {}
  const profiles = await storage.get<Profile[]>(PROFILES_KEY) || []

  return {
    groups,
    settings,
    profiles,
    exportedAt: new Date().toISOString(),
    version: '1.1'
  }
}

// Fonction pour importer les données
const importData = async (data: any) => {
  try {
    // Valider les données
    if (!data.groups || !Array.isArray(data.groups)) {
      throw new Error('Format de données invalide: groupes manquants')
    }

    // Importer les groupes
    await storage.set('groups', data.groups)

    // Importer les settings s'ils existent
    if (data.settings) {
      await storage.set('settings', data.settings)
    }

    if (data.profiles && Array.isArray(data.profiles)) {
      await storage.set(PROFILES_KEY, data.profiles)
    }

    return {
      success: true,
      importedGroups: data.groups.length,
      importedProfiles: data.profiles ? data.profiles.length : 0
    }
  } catch (error) {
    console.error('Import error:', error)
    throw error
  }
}

const captureCurrentState = async () => {
  const [tabs, tabGroups] = await Promise.all([
    chrome.tabs.query({ windowType: 'normal' }),
    chrome.tabGroups.query({})
  ])

  const groupMap = new Map<number, ProfileGroup>()

  tabGroups.forEach(group => {
    groupMap.set(group.id, {
      id: group.id.toString(),
      windowId: group.windowId,
      title: group.title || 'Groupe sans titre',
      color: group.color,
      collapsed: group.collapsed,
      tabs: []
    })
  })

  const profileGroups: ProfileGroup[] = [...groupMap.values()]
  const ungrouped: ProfileGroup = {
    id: 'ungrouped',
    title: 'Onglets non groupés',
    tabs: []
  }

  tabs.forEach(tab => {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return
    }

    const profileTab: ProfileTab = {
      id: tab.id ? tab.id.toString() : generateId(),
      url: tab.url,
      title: tab.title || 'Sans titre',
      favicon: tab.favIconUrl ?? undefined,
      pinned: tab.pinned,
      order: tab.index
    }

    if (typeof tab.groupId === 'number' && groupMap.has(tab.groupId)) {
      groupMap.get(tab.groupId)?.tabs.push(profileTab)
    } else {
      ungrouped.tabs.push(profileTab)
    }
  })

  if (ungrouped.tabs.length > 0) {
    profileGroups.push(ungrouped)
  }

  profileGroups.forEach(group => {
    group.tabs.sort((a, b) => a.order - b.order)
  })

  const tabCount = profileGroups.reduce((total, group) => total + group.tabs.length, 0)

  return {
    groups: profileGroups,
    meta: {
      groupCount: profileGroups.length,
      tabCount
    }
  }
}

const saveProfile = async ({
  profileId,
  name,
  description,
  groups
}: {
  profileId?: string
  name: string
  description?: string
  groups: ProfileGroup[]
}) => {
  if (!name || !name.trim()) {
    throw new Error('Le nom du profil est obligatoire')
  }

  const profiles = await storage.get<Profile[]>(PROFILES_KEY) || []
  const now = new Date().toISOString()

  const sanitizedGroups = groups.map(group => ({
    ...group,
    id: group.id || generateId(),
    tabs: [...group.tabs]
      .map(tab => ({
        ...tab,
        id: tab.id || generateId()
      }))
      .sort((a, b) => a.order - b.order)
  }))

  if (profileId) {
    const index = profiles.findIndex(profile => profile.id === profileId)
    if (index === -1) {
      throw new Error('Profil introuvable')
    }

    profiles[index] = {
      ...profiles[index],
      name: name.trim(),
      description,
      groups: sanitizedGroups,
      updatedAt: now
    }
  } else {
    profiles.push({
      id: generateId(),
      name: name.trim(),
      description,
      groups: sanitizedGroups,
      createdAt: now,
      updatedAt: now
    })
  }

  await storage.set(PROFILES_KEY, profiles)

  return getProfiles()
}

const getProfiles = async () => {
  const profiles = await storage.get<Profile[]>(PROFILES_KEY) || []

  const summaries: ProfileSummary[] = profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    description: profile.description,
    groupCount: profile.groups.length,
    tabCount: profile.groups.reduce((total, group) => total + group.tabs.length, 0),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  }))

  return {
    profiles,
    summaries
  }
}

const deleteProfile = async (profileId: string) => {
  if (!profileId) {
    throw new Error('Identifiant de profil manquant')
  }

  const profiles = await storage.get<Profile[]>(PROFILES_KEY) || []
  const updatedProfiles = profiles.filter(profile => profile.id !== profileId)
  await storage.set(PROFILES_KEY, updatedProfiles)

  return getProfiles()
}

const openProfile = async (
  profileId: string,
  options?: { openInNewWindow?: boolean }
) => {
  const profiles = await storage.get<Profile[]>(PROFILES_KEY) || []
  const profile = profiles.find(item => item.id === profileId)

  if (!profile) {
    throw new Error('Profil introuvable')
  }

  const totalTabs = profile.groups.reduce((total, group) => total + group.tabs.length, 0)
  if (totalTabs === 0) {
    return { restoredTabs: 0, restoredGroups: 0 }
  }

  let targetWindowId: number
  let placeholderTabId: number | undefined

  if (options?.openInNewWindow) {
    const window = await chrome.windows.create({ focused: true })
    targetWindowId = window.id
    placeholderTabId = window.tabs?.[0]?.id
  } else {
    const [currentWindow] = await chrome.windows.getAll({ populate: false, windowTypes: ['normal'] })
    targetWindowId = currentWindow?.id ?? chrome.windows.WINDOW_ID_CURRENT
  }

  const firstCreatedTabId = await restoreProfileGroups(profile.groups, targetWindowId)

  if (placeholderTabId) {
    try {
      await chrome.tabs.remove(placeholderTabId)
    } catch (error) {
      console.warn('Impossible de fermer l\'onglet temporaire', error)
    }
  }

  if (firstCreatedTabId) {
    await chrome.tabs.update(firstCreatedTabId, { active: true })
    await chrome.windows.update(targetWindowId, { focused: true })
  }

  return {
    restoredTabs: totalTabs,
    restoredGroups: profile.groups.length
  }
}

const restoreProfileGroups = async (groups: ProfileGroup[], windowId: number) => {
  let firstCreatedTabId: number | undefined

  for (const group of groups) {
    const sortedTabs = [...group.tabs].sort((a, b) => a.order - b.order)

    if (sortedTabs.length === 0) {
      continue
    }

    const createdTabs: chrome.tabs.Tab[] = []
    for (const tab of sortedTabs) {
      try {
        const createdTab = await chrome.tabs.create({
          windowId,
          url: tab.url,
          active: false
        })

        if (typeof createdTab.id === 'number' && firstCreatedTabId === undefined) {
          firstCreatedTabId = createdTab.id
        }

        createdTabs.push(createdTab)

        if (tab.pinned && typeof createdTab.id === 'number') {
          await chrome.tabs.update(createdTab.id, { pinned: true })
        }
      } catch (error) {
        console.warn('Impossible de restaurer un onglet:', tab.url, error)
      }
    }

    const tabIds = createdTabs
      .map(tab => tab.id)
      .filter((id): id is number => typeof id === 'number')

    if (tabIds.length === 0) {
      continue
    }

    if (group.id === 'ungrouped') {
      continue
    }

    try {
      const chromeGroupId = await chrome.tabs.group({
        tabIds,
        createProperties: { windowId }
      })

      await chrome.tabGroups.update(chromeGroupId, {
        title: group.title,
        color: group.color || 'blue'
      })

      if (typeof group.collapsed === 'boolean') {
        await chrome.tabGroups.update(chromeGroupId, { collapsed: group.collapsed })
      }
    } catch (error) {
      console.warn('Impossible de regrouper les onglets restaurés', error)
    }
  }

  return firstCreatedTabId
}