import { createClient, RedisClientType } from 'redis'
import { logger } from './logger'

class CacheService {
  private client: RedisClientType | null = null
  private isConnected = false
  private connectionAttempts = 0
  private maxConnectionAttempts = 3

  constructor() {
    this.connect()
  }

  private async connect() {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      logger.error('cache_connection_failed', new Error('Max connection attempts reached'), undefined)
      return
    }

    try {
      // Se não há URL do Redis configurada, usar cache em memória como fallback
      if (!process.env.REDIS_URL) {
        logger.warn('Redis URL not configured, cache will be disabled')
        return
      }

      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        }
      })

      this.client.on('error', (err) => {
        logger.error('redis_error', err, undefined)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        logger.info('Redis connected successfully')
        this.isConnected = true
        this.connectionAttempts = 0
      })

      this.client.on('disconnect', () => {
        logger.warn('Redis disconnected')
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      this.connectionAttempts++
      logger.error('redis_connection_error', error as Error, undefined)
      this.isConnected = false
      
      // Tentar reconectar após um delay
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        setTimeout(() => this.connect(), 5000 * this.connectionAttempts)
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null
    }

    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      logger.error('cache_get_error', error as Error, undefined, { key })
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const serialized = JSON.stringify(value)
      await this.client.setEx(key, ttlSeconds, serialized)
      return true
    } catch (error) {
      logger.error('cache_set_error', error as Error, undefined, { key, ttlSeconds })
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      logger.error('cache_del_error', error as Error, undefined, { key })
      return false
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(keys)
      }
      return true
    } catch (error) {
      logger.error('cache_del_pattern_error', error as Error, undefined, { pattern })
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('cache_exists_error', error as Error, undefined, { key })
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return -1
    }

    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error('cache_ttl_error', error as Error, undefined, { key })
      return -1
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      await this.client.flushDb()
      return true
    } catch (error) {
      logger.error('cache_flush_error', error as Error, undefined)
      return false
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect()
        this.isConnected = false
      } catch (error) {
        logger.error('cache_disconnect_error', error as Error, undefined)
      }
    }
  }

  // Métodos utilitários para chaves de cache
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`
  }

  static generateUserKey(userId: string, resource: string, ...parts: (string | number)[]): string {
    return this.generateKey('user', userId, resource, ...parts)
  }

  static generateStoreKey(storeId: string, resource: string, ...parts: (string | number)[]): string {
    return this.generateKey('store', storeId, resource, ...parts)
  }

  static generateGlobalKey(resource: string, ...parts: (string | number)[]): string {
    return this.generateKey('global', resource, ...parts)
  }
}

// Exportar a classe e instância singleton do cache
export { CacheService }
export const cache = new CacheService()

// Decorator para cache automático
export function cached(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `method:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      // Tentar buscar do cache
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Executar método original
      const result = await method.apply(this, args)
      
      // Salvar no cache
      await cache.set(cacheKey, result, ttlSeconds)
      
      return result
    }

    return descriptor
  }
}

// Tipos para TTL padrão
export const CacheTTL = {
  SHORT: 60,        // 1 minuto
  MEDIUM: 300,      // 5 minutos
  LONG: 900,        // 15 minutos
  HOUR: 3600,       // 1 hora
  DAY: 86400        // 24 horas
} as const

export type CacheTTLType = typeof CacheTTL[keyof typeof CacheTTL]