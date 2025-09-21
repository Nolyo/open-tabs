import { Storage } from '@plasmohq/storage'
import { useState, useEffect } from 'react'
import type { TabGroup, AppSettings } from '../types'

const storage = new Storage()

export const useStorage = () => {
  const [groups, setGroups] = useState<TabGroup[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    autoOpenNewTabs: false,
    defaultGroupColor: '#4285f4'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedGroups = await storage.get<TabGroup[]>('groups')
        const storedSettings = await storage.get<AppSettings>('settings')

        if (storedGroups) {
          setGroups(storedGroups)
        }

        if (storedSettings) {
          setSettings(storedSettings)
        }
      } catch (error) {
        console.error('Error loading storage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const createGroup = async (name: string, color: string = '#4285f4') => {
    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name,
      color,
      urls: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedGroups = [...groups, newGroup]
    await storage.set('groups', updatedGroups)
    setGroups(updatedGroups)

    return newGroup
  }

  const updateGroup = async (groupId: string, updates: Partial<TabGroup>) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? { ...group, ...updates, updatedAt: new Date() }
        : group
    )

    await storage.set('groups', updatedGroups)
    setGroups(updatedGroups)
  }

  const deleteGroup = async (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId)
    await storage.set('groups', updatedGroups)
    setGroups(updatedGroups)
  }

  const addUrlToGroup = async (groupId: string, url: string, title?: string) => {
    // Récupérer les groupes les plus récents du storage
    const currentGroups = await storage.get<TabGroup[]>('groups') || []
    const group = currentGroups.find(g => g.id === groupId)
    if (!group) throw new Error('Group not found')

    // Vérifier si l'URL existe déjà dans le groupe
    const urlExists = group.urls.some(existingUrl => existingUrl.url === url)
    if (urlExists) {
      throw new Error('Cette URL existe déjà dans ce groupe')
    }

    const newUrl = {
      id: Date.now().toString(),
      url,
      title,
      groupId,
      order: group.urls.length
    }

    const updatedGroups = currentGroups.map(g =>
      g.id === groupId
        ? {
            ...g,
            urls: [...g.urls, newUrl],
            updatedAt: new Date()
          }
        : g
    )

    await storage.set('groups', updatedGroups)
    setGroups(updatedGroups)

    return newUrl
  }

  const removeUrlFromGroup = async (groupId: string, urlId: string) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            urls: group.urls.filter(url => url.id !== urlId),
            updatedAt: new Date()
          }
        : group
    )

    await storage.set('groups', updatedGroups)
    setGroups(updatedGroups)
  }

  return {
    groups,
    settings,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
    addUrlToGroup,
    removeUrlFromGroup
  }
}