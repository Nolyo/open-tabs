import React from 'react'
import { ComponentProps } from '~/types/components'

interface NavigationItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

interface OptionsNavigationProps extends ComponentProps {
  items: NavigationItem[]
  activeItem: string
  onItemChange: (itemId: string) => void
  orientation?: 'horizontal' | 'vertical'
}

export function OptionsNavigation({
  items,
  activeItem,
  onItemChange,
  orientation = 'horizontal',
  className = '',
}: OptionsNavigationProps) {
  const baseStyles = [
    'flex space-x-1',
    orientation === 'vertical' ? 'flex-col space-y-1 space-x-0' : '',
    className,
  ].join(' ')

  const itemStyles = (itemId: string) => [
    'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
    activeItem === itemId
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  ].join(' ')

  return (
    <nav className={baseStyles}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemChange(item.id)}
          className={itemStyles(item.id)}
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          <span>{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}