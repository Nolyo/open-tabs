import React, { useState, useEffect } from 'react'
import { Notification } from '~/components/ui/Notification'
import { NotificationOptions } from '~/types/components'

interface NotificationItem {
  id: string
  options: NotificationOptions
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const addNotification = (options: NotificationOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, options }])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  useEffect(() => {
    const handleCustomEvent = (event: CustomEvent<NotificationOptions>) => {
      addNotification(event.detail)
    }

    window.addEventListener('notification' as any, handleCustomEvent as any)

    return () => {
      window.removeEventListener('notification' as any, handleCustomEvent as any)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          title={notification.options.title}
          message={notification.options.message}
          type={notification.options.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

export const useNotification = () => {
  const showNotification = (options: NotificationOptions) => {
    const event = new CustomEvent('notification', { detail: options })
    window.dispatchEvent(event)
  }

  return { showNotification }
}