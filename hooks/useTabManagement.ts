import { useState, useCallback } from 'react'

export interface Tab {
  id: string
  title: string
  url: string
  favIconUrl?: string
  groupId?: string
  windowId?: number
}

export interface TabGroup {
  id: string
  title: string
  color: string
  tabs: Tab[]
}

export interface UseTabManagementReturn {
  tabs: Tab[]
  groups: TabGroup[]
  activeGroup: string | null
  setActiveGroup: (groupId: string | null) => void
  refreshTabs: () => Promise<void>
  refreshGroups: () => Promise<void>
  addTabToGroup: (tabId: string, groupId: string) => Promise<void>
  removeTabFromGroup: (tabId: string) => Promise<void>
  closeTab: (tabId: string) => Promise<void>
  createGroup: (title: string, color: string) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
}

export function useTabManagement(): UseTabManagementReturn {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [groups, setGroups] = useState<TabGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const refreshTabs = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TABS',
        payload: { groupId: activeGroup },
      })
      setTabs(response.tabs || [])
    } catch (error) {
      console.error('Error refreshing tabs:', error)
    }
  }, [activeGroup])

  const refreshGroups = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_GROUPS',
      })
      setGroups(response.groups || [])
    } catch (error) {
      console.error('Error refreshing groups:', error)
    }
  }, [])

  const addTabToGroup = useCallback(async (tabId: string, groupId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_TAB_TO_GROUP',
        payload: { tabId, groupId },
      })
      await refreshTabs()
    } catch (error) {
      console.error('Error adding tab to group:', error)
    }
  }, [refreshTabs])

  const removeTabFromGroup = useCallback(async (tabId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'REMOVE_TAB_FROM_GROUP',
        payload: { tabId },
      })
      await refreshTabs()
    } catch (error) {
      console.error('Error removing tab from group:', error)
    }
  }, [refreshTabs])

  const closeTab = useCallback(async (tabId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'CLOSE_TAB',
        payload: { tabId },
      })
      await refreshTabs()
    } catch (error) {
      console.error('Error closing tab:', error)
    }
  }, [refreshTabs])

  const createGroup = useCallback(async (title: string, color: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'CREATE_GROUP',
        payload: { title, color },
      })
      await refreshGroups()
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }, [refreshGroups])

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'DELETE_GROUP',
        payload: { groupId },
      })
      await refreshGroups()
      if (activeGroup === groupId) {
        setActiveGroup(null)
      }
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }, [refreshGroups, activeGroup])

  return {
    tabs,
    groups,
    activeGroup,
    setActiveGroup,
    refreshTabs,
    refreshGroups,
    addTabToGroup,
    removeTabFromGroup,
    closeTab,
    createGroup,
    deleteGroup,
  }
}