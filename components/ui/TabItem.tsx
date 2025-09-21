import React from 'react'
import { TabItemProps } from '~/types/components'
import { GROUP_COLORS } from '~/constants'

export function TabItem({
  tab,
  isActive = false,
  onClick,
  onClose,
  onContextMenu,
  showCloseButton = true,
  className = '',
}: TabItemProps) {
  const groupColor = tab.groupId ? GROUP_COLORS[tab.groupId as keyof typeof GROUP_COLORS] : null

  return (
    <div
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-colors
        ${isActive
          ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-500'
          : 'hover:bg-gray-50 text-gray-700'
        }
        ${className}
      `}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {tab.favIconUrl ? (
        <img
          src={tab.favIconUrl}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-4 h-4 flex-shrink-0 bg-gray-300 rounded"></div>
      )}

      {groupColor && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: groupColor }}
        ></div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {tab.title}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {tab.url}
        </div>
      </div>

      {showCloseButton && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose?.()
          }}
          className="
            p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100
            transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}