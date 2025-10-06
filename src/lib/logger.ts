import fs from 'fs'
import path from 'path'

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: Record<string, any>
  userId?: string
  requestId?: string
  ip?: string
}

class Logger {
  private logLevel: LogLevel
  private logFile?: string
  private isDevelopment: boolean

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
    this.logFile = process.env.LOG_FILE
    this.isDevelopment = process.env.NODE_ENV === 'development'
    
    // Criar diretório de logs se não existir
    if (this.logFile && !this.isDevelopment) {
      const logDir = path.dirname(this.logFile)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    }
    
    return levels[level] <= levels[this.logLevel]
  }

  private formatMessage(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Formato mais legível para desenvolvimento
      const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : ''
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${meta}`
    } else {
      // Formato JSON estruturado para produção
      return JSON.stringify(entry)
    }
  }

  private writeLog(entry: LogEntry): void {
    const message = this.formatMessage(entry)
    
    if (this.isDevelopment) {
      // No desenvolvimento, usar console
      switch (entry.level) {
        case 'error':
          console.error(message)
          break
        case 'warn':
          console.warn(message)
          break
        case 'info':
          console.info(message)
          break
        case 'debug':
          console.debug(message)
          break
      }
    } else {
      // Em produção, escrever no arquivo
      if (this.logFile) {
        try {
          fs.appendFileSync(this.logFile, message + '\n')
        } catch (error) {
          console.error('Failed to write to log file:', error)
          console.log(message) // Fallback para console
        }
      } else {
        console.log(message)
      }
    }
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    }

    this.writeLog(entry)
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta)
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta)
  }

  // Métodos específicos para contextos comuns
  apiRequest(method: string, path: string, userId?: string, ip?: string): void {
    this.info('API Request', {
      method,
      path,
      userId,
      ip,
      type: 'api_request'
    })
  }

  apiResponse(method: string, path: string, status: number, duration: number, userId?: string): void {
    this.info('API Response', {
      method,
      path,
      status,
      duration,
      userId,
      type: 'api_response'
    })
  }

  apiError(method: string, path: string, error: Error, userId?: string): void {
    this.error('API Error', {
      method,
      path,
      error: error.message,
      stack: error.stack,
      userId,
      type: 'api_error'
    })
  }

  whatsappMessage(action: string, phone: string, success: boolean, error?: string): void {
    this.info('WhatsApp Message', {
      action,
      phone: phone.replace(/\d(?=\d{4})/g, '*'), // Mascarar número
      success,
      error,
      type: 'whatsapp'
    })
  }

  appointment(action: string, appointmentId: string, userId?: string, storeId?: string): void {
    this.info('Appointment Action', {
      action,
      appointmentId,
      userId,
      storeId,
      type: 'appointment'
    })
  }

  security(event: string, ip?: string, userId?: string, details?: Record<string, any>): void {
    this.warn('Security Event', {
      event,
      ip,
      userId,
      details,
      type: 'security'
    })
  }

  performance(operation: string, duration: number, details?: Record<string, any>): void {
    this.info('Performance Metric', {
      operation,
      duration,
      details,
      type: 'performance'
    })
  }
}

// Singleton instance
export const logger = new Logger()

// Helper para medir performance
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = Date.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.then(
        (value) => {
          logger.performance(operation, Date.now() - start)
          return value
        },
        (error) => {
          logger.performance(operation, Date.now() - start, { error: error.message })
          throw error
        }
      )
    } else {
      logger.performance(operation, Date.now() - start)
      return result
    }
  } catch (error) {
    logger.performance(operation, Date.now() - start, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    throw error
  }
}