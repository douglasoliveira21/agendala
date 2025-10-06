import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
      error?: string
    }
    whatsapp: {
      status: 'up' | 'down'
      error?: string
    }
    storage: {
      status: 'up' | 'down'
      error?: string
    }
  }
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}

const startTime = Date.now()

async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    
    return { status: 'up', responseTime }
  } catch (error) {
    logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

async function checkWhatsApp(): Promise<{ status: 'up' | 'down'; error?: string }> {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.WHAPI_TOKEN || !process.env.WHAPI_BASE_URL) {
      return { status: 'down', error: 'WhatsApp configuration missing' }
    }
    
    // Em produção, você pode fazer uma verificação real da API
    // Por enquanto, apenas verificar se as configurações existem
    return { status: 'up' }
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

async function checkStorage(): Promise<{ status: 'up' | 'down'; error?: string }> {
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const uploadPath = process.env.UPLOAD_PATH || './uploads'
    const testFile = path.join(uploadPath, '.health-check')
    
    // Tentar escrever um arquivo de teste
    fs.writeFileSync(testFile, 'health-check')
    fs.unlinkSync(testFile)
    
    return { status: 'up' }
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage()
  const total = usage.heapTotal
  const used = usage.heapUsed
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round((used / total) * 100)
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar token de health check se configurado
    const healthToken = process.env.HEALTH_CHECK_TOKEN
    if (healthToken) {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      if (token !== healthToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    // Executar verificações em paralelo
    const [databaseCheck, whatsappCheck, storageCheck] = await Promise.all([
      checkDatabase(),
      checkWhatsApp(),
      checkStorage()
    ])
    
    const uptime = Date.now() - startTime
    const memory = getMemoryUsage()
    
    const healthCheck: HealthCheck = {
      status: databaseCheck.status === 'up' && whatsappCheck.status === 'up' && storageCheck.status === 'up' 
        ? 'healthy' 
        : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck,
        whatsapp: whatsappCheck,
        storage: storageCheck
      },
      uptime,
      memory
    }
    
    const responseTime = Date.now() - startTime
    
    // Log da verificação de saúde
    logger.info('Health check completed', {
      status: healthCheck.status,
      responseTime,
      checks: healthCheck.checks
    })
    
    // Retornar status HTTP apropriado
    const statusCode = healthCheck.status === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthCheck, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    logger.error('Health check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}