import React from 'react'
import { ComponentProps } from '~/types/components'

interface PopupFooterProps extends ComponentProps {
  actions?: React.ReactNode
}

export function PopupFooter({
  actions,
  children,
  className = '',
}: PopupFooterProps) {
  return (
    <div
      className={`
        flex items-center justify-between p-4 border-t
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      <div className="flex items-center space-x-2">
        {children}
      </div>
      <div className="flex items-center space-x-2">
        {actions}
      </div>
    </div>
  )
}