import React from 'react'
import { TabListProps, Tab } from '~/types/components'
import { TabItem } from './TabItem'
import { LoadingSpinner } from './LoadingSpinner'

export function TabList({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabContextMenu,
  showGroupHeaders = true,
  compact = false,
  className = '',
}: TabListProps) {
  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        Aucun onglet trouvé
      </div>
    )
  }

  const groupedTabs = showGroupHeaders
    ? tabs.reduce((groups, tab) => {
        const groupId = tab.groupId || 'ungrouped'
        if (!groups[groupId]) {
          groups[groupId] = []
        }
        groups[groupId].push(tab)
        return groups
      }, {} as Record<string, Tab[]>)
    : { all: tabs }

  return (
    <div className={`space-y-2 ${className}`}>
      {Object.entries(groupedTabs).map(([groupId, groupTabs]) => (
        <div key={groupId} className="space-y-1">
          {showGroupHeaders && groupId !== 'ungrouped' && (
            <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {groupTabs[0]?.groupId || 'Non groupé'}
            </div>
          )}
          {groupTabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => onTabClick?.(tab)}
              onClose={() => onTabClose?.(tab.id)}
              onContextMenu={(e) => onTabContextMenu?.(e, tab.id)}
              showCloseButton={!compact}
              className={compact ? 'py-1' : ''}
            />
          ))}
        </div>
      ))}
    </div>
  )
}