import React from 'react'
import { ComponentProps } from '~/types/components'

interface OptionsContainerProps extends ComponentProps {
  maxWidth?: string
}

export function OptionsContainer({
  children,
  className = '',
  maxWidth = '1200px',
}: OptionsContainerProps) {
  return (
    <div
      className={`
        min-h-screen bg-gray-50
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}