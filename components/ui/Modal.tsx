import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ModalProps } from '~/types/components'
import { MODAL_SIZES } from '~/constants'

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  className = '',
}: ModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalRoot(document.body)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !portalRoot) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalSizeClass = MODAL_SIZES[size]

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ contain: 'layout style paint' }}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      <div
        className={`
          relative rounded-lg shadow-xl max-h-[90vh] overflow-hidden
          ${modalSizeClass} w-full mx-4 transform transition-all
          ${className}
        `}
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          contain: 'layout style paint'
        }}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button
              onClick={onClose}
              className="hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg
                className="h-6 w-6"
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
          </div>
        )}

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, portalRoot)
}