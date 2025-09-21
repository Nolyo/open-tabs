export interface NotificationOptions {
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export class NotificationService {
  private notifications: Map<string, NodeJS.Timeout> = new Map()

  show(options: NotificationOptions): void {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = options.duration || 3000

    console.log(`[${options.type || 'info'}] ${options.title}: ${options.message}`)

    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: options.title,
        message: options.message,
        priority: 2,
      })
    }

    const timeout = setTimeout(() => {
      this.notifications.delete(id)
    }, duration)

    this.notifications.set(id, timeout)
  }

  success(title: string, message: string): void {
    this.show({ title, message, type: 'success' })
  }

  error(title: string, message: string): void {
    this.show({ title, message, type: 'error', duration: 5000 })
  }

  info(title: string, message: string): void {
    this.show({ title, message, type: 'info' })
  }

  warning(title: string, message: string): void {
    this.show({ title, message, type: 'warning', duration: 4000 })
  }

  clearAll(): void {
    this.notifications.forEach((timeout) => clearTimeout(timeout))
    this.notifications.clear()
  }
}

export const notificationService = new NotificationService()