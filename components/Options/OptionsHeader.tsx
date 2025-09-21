import React from 'react'
import { ComponentProps } from '~/types/components'

interface OptionsHeaderProps extends ComponentProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function OptionsHeader({
  title,
  description,
  actions,
  className = '',
}: OptionsHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}