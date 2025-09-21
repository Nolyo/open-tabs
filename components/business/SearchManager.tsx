import React from 'react'
import { useSearch } from '~/hooks'
import { SearchBar } from '~/components/ui/SearchBar'
import { TabList } from '~/components/ui/TabList'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

interface SearchManagerProps {
  tabs: Array<{
    id: string
    title: string
    url: string
    favIconUrl?: string
    groupId?: string
    windowId?: number
  }>
  onTabSelect?: (tab: { id: string; title: string; url: string }) => void
  onTabClose?: (tabId: string) => void
  className?: string
}

export function SearchManager({
  tabs,
  onTabSelect,
  onTabClose,
  className = '',
}: SearchManagerProps) {
  const { searchQuery, setSearchQuery, filteredTabs, isSearching } = useSearch(tabs)

  const handleTabClick = (tab: any) => {
    onTabSelect?.(tab)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="Rechercher un onglet..."
      />

      {isSearching && (
        <div className="text-sm text-gray-500">
          {filteredTabs.length} onglet{filteredTabs.length !== 1 ? 's' : ''} trouvé{filteredTabs.length !== 1 ? 's' : ''}
        </div>
      )}

      {filteredTabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg
            className="w-12 h-12 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery ? (
            <p>Aucun onglet trouvé pour "{searchQuery}"</p>
          ) : (
            <p>Commencez à taper pour rechercher des onglets</p>
          )}
        </div>
      ) : (
        <TabList
          tabs={filteredTabs}
          onTabClick={handleTabClick}
          onTabClose={onTabClose}
          onTabContextMenu={(e, tabId) => {
            e.preventDefault()
            console.log('Context menu for tab:', tabId)
          }}
          compact={isSearching}
        />
      )}
    </div>
  )
}