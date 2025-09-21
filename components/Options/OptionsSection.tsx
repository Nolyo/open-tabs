import React from 'react'
import { ComponentProps } from '~/types/components'

interface OptionsSectionProps extends ComponentProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function OptionsSection({
  title,
  description,
  actions,
  padding = 'md',
  children,
  className = '',
}: OptionsSectionProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const sectionStyles = [
    'bg-white rounded-lg shadow-sm border border-gray-200',
    paddingStyles[padding],
    className,
  ].join(' ')

  return (
    <div className={sectionStyles}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}