import React from 'react'
import { GroupItemProps } from '~/types/components'
import { GROUP_COLORS } from '~/constants'

export function GroupItem({
  group,
  isActive = false,
  onClick,
  onDelete,
  onEdit,
  onCollapse,
  showActions = true,
  className = '',
}: GroupItemProps) {
  const color = GROUP_COLORS[group.color as keyof typeof GROUP_COLORS]

  return (
    <div
      className={`
        flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors
        ${isActive
          ? 'bg-gray-100 border-l-4 border-gray-400'
          : 'hover:bg-gray-50'
        }
        ${className}
      `}
      onClick={onClick}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {group.title}
          </h3>
          <span className="text-xs text-gray-500">
            ({group.tabs.length})
          </span>
        </div>
        {group.collapsed && (
          <div className="text-xs text-gray-500">Réduit</div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center space-x-1">
          {onCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCollapse()
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
              title={group.collapsed ? 'Développer' : 'Réduire'}
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
                  d={group.collapsed ? 'M12 4v16m8-8H4' : 'M20 12H4'}
                />
              </svg>
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
              title="Modifier"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
              title="Supprimer"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}