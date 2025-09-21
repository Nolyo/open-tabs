import React from 'react'
import { ComponentProps } from '~/types/components'

interface PopupHeaderProps extends ComponentProps {
  title?: string
  showCloseButton?: boolean
  onClose?: () => void
  actions?: React.ReactNode
}

export function PopupHeader({
  title,
  showCloseButton = true,
  onClose,
  actions,
  children,
  className = '',
}: PopupHeaderProps) {
  return (
    <div
      className={`
        flex items-center justify-between p-4 border-b border-gray-200
        bg-gray-50
        ${className}
      `}
    >
      <div className="flex items-center space-x-3">
        {title && (
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        )}
        {children}
      </div>

      <div className="flex items-center space-x-2">
        {actions}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            title="Fermer"
          >
            <svg
              className="w-5 h-5"
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
    </div>
  )
}