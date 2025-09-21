import React from 'react'
import { ComponentProps } from '~/types/components'

interface PopupContentProps extends ComponentProps {
  scrollable?: boolean
}

export function PopupContent({
  children,
  scrollable = true,
  className = '',
}: PopupContentProps) {
  return (
    <div
      className={`
        flex-1 ${scrollable ? 'overflow-y-auto' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}