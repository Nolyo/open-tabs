import { Storage } from '@plasmohq/storage'
import type { TabGroup, TabUrl } from './types'

const storage = new Storage()

// Initialisation du storage avec des données par défaut
const initializeStorage = async () => {
  const existingGroups = await storage.get<TabGroup[]>('groups')
  if (!existingGroups) {
    await storage.set('groups', [])
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
  }
})