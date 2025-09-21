import { useState, useMemo } from 'react'

export interface Tab {
  id: string
  title: string
  url: string
  favIconUrl?: string
  groupId?: string
  windowId?: number
}

export interface UseSearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredTabs: Tab[]
  isSearching: boolean
}

export function useSearch(tabs: Tab[]): UseSearchReturn {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabs

    const query = searchQuery.toLowerCase().trim()
    return tabs.filter((tab) =>
      tab.title.toLowerCase().includes(query) ||
      tab.url.toLowerCase().includes(query)
    )
  }, [tabs, searchQuery])

  const isSearching = searchQuery.trim().length > 0

  return {
    searchQuery,
    setSearchQuery,
    filteredTabs,
    isSearching,
  }
}