import React, { useEffect, useRef } from 'react'
import { ContextMenuProps } from '~/types/components'

export function ContextMenu({
  isOpen,
  position,
  onClose,
  items,
  className = '',
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const menuWidth = menu.offsetWidth
      const menuHeight = menu.offsetHeight

      let x = position.x
      let y = position.y

      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10
      }

      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10
      }

      menu.style.left = `${x}px`
      menu.style.top = `${y}px`
    }
  }, [isOpen, position])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className={`
        fixed z-50 min-w-[200px] bg-white rounded-md shadow-lg border border-gray-200 py-1
        ${className}
      `}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.separator && (
            <div className="border-t border-gray-200 my-1"></div>
          )}
          {!item.separator && (
            <button
              onClick={() => {
                item.onClick()
                onClose()
              }}
              disabled={item.disabled}
              className={`
                w-full text-left px-4 py-2 text-sm transition-colors
                ${item.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
                flex items-center space-x-2
              `}
            >
              {item.icon && (
                <span className="text-gray-400">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}