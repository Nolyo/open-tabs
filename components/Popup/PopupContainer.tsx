import React from 'react'
import { ComponentProps } from '~/types/components'

interface PopupContainerProps extends ComponentProps {
  maxWidth?: string
  maxHeight?: string
}

export function PopupContainer({
  children,
  className = '',
  maxWidth = '400px',
  maxHeight = '600px',
}: PopupContainerProps) {
  return (
    <div
      className={`
        flex flex-col bg-white rounded-lg shadow-xl overflow-hidden
        border border-gray-200
        ${className}
      `}
      style={{ maxWidth, maxHeight }}
    >
      {children}
    </div>
  )
}