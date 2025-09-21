import { notificationService } from './notificationService'

export interface ErrorContext {
  operation?: string
  details?: any
  userId?: string
}

export class ErrorService {
  private errorLog: Array<{
    error: Error
    context: ErrorContext
    timestamp: Date
  }> = []

  handleError(error: Error | string, context: ErrorContext = {}): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error

    const errorEntry = {
      error: errorObj,
      context,
      timestamp: new Date(),
    }

    this.errorLog.push(errorEntry)
    this.logToConsole(errorEntry)
    this.notifyUser(errorObj, context)
  }

  private logToConsole(errorEntry: typeof this.errorLog[0]): void {
    const { error, context, timestamp } = errorEntry
    const contextStr = context.operation ? ` during ${context.operation}` : ''

    console.error(`[${timestamp.toISOString()}] Error${contextStr}:`, error)
    if (context.details) {
      console.error('Error details:', context.details)
    }
  }

  private notifyUser(error: Error, context: ErrorContext): void {
    const operation = context.operation || 'opération'

    let userMessage = 'Une erreur inattendue s&apos;est produite'

    if (error.message.includes('Failed to fetch')) {
      userMessage = 'Erreur de connexion au serveur'
    } else if (error.message.includes('Permission denied')) {
      userMessage = 'Permission refusée pour cette action'
    } else if (error.message.includes('Invalid data')) {
      userMessage = 'Données invalides fournies'
    }

    notificationService.error(
      `Erreur lors de ${operation}`,
      userMessage
    )
  }

  getErrorLog(): Array<typeof this.errorLog[0]> {
    return [...this.errorLog]
  }

  clearErrorLog(): void {
    this.errorLog = []
  }

  async reportError(error: Error, context: ErrorContext = {}): Promise<void> {
    this.handleError(error, context)

    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }
}

export const errorService = new ErrorService()