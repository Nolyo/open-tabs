import React from 'react'
import { ComponentProps } from '~/types/components'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>, ComponentProps {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const baseStyles = [
    'block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500',
  ]

  const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''

  const iconStyles = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : ''

  const classes = [
    ...baseStyles,
    errorStyles,
    iconStyles,
    className,
  ].join(' ')

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-500">{leftIcon}</span>
          </div>
        )}

        <input
          id={inputId}
          className={classes}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">{rightIcon}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}