import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/status - Status da API e informações da API Key
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Informações sobre a API Key
    const apiKeyInfo = {
      id: apiKeyContext.apiKey.id,
      name: apiKeyContext.apiKey.name,
      permissions: apiKeyContext.apiKey.permissions,
      rateLimit: apiKeyContext.apiKey.rateLimit,
      lastUsedAt: apiKeyContext.apiKey.lastUsedAt,
      expiresAt: apiKeyContext.apiKey.expiresAt,
      scope: {
        companyId: apiKeyContext.apiKey.companyId,
        storeId: apiKeyContext.apiKey.storeId,
        userId: apiKeyContext.apiKey.userId
      }
    }

    // Status da API
    const apiStatus = {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }

    // Estatísticas de uso (últimas 24 horas)
    const last24Hours = new Date()
    last24Hours.setHours(last24Hours.getHours() - 24)

    const usageStats = await prisma.apiUsageLog.aggregate({
      where: {
        apiKeyId: apiKeyContext.apiKey.id,
        createdAt: {
          gte: last24Hours
        }
      },
      _count: {
        id: true
      },
      _avg: {
        responseTime: true
      }
    })

    const errorCount = await prisma.apiUsageLog.count({
      where: {
        apiKeyId: apiKeyContext.apiKey.id,
        createdAt: {
          gte: last24Hours
        },
        statusCode: {
          gte: 400
        }
      }
    })

    const usage = {
      last24Hours: {
        totalRequests: usageStats._count.id || 0,
        errorRequests: errorCount,
        averageResponseTime: Math.round(usageStats._avg.responseTime || 0),
        successRate: usageStats._count.id > 0 
          ? Math.round(((usageStats._count.id - errorCount) / usageStats._count.id) * 100)
          : 100
      }
    }

    // Rate limiting info
    const rateLimitInfo = {
      limit: apiKeyContext.apiKey.rateLimit || 1000,
      remaining: Math.max(0, (apiKeyContext.apiKey.rateLimit || 1000) - (usageStats._count.id || 0)),
      resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Reset em 1 hora
    }

    const response = createApiResponse({
      apiKey: apiKeyInfo,
      api: apiStatus,
      usage,
      rateLimit: rateLimitInfo
    })

    // Adicionar headers de rate limiting
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime)

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'GET',
      '/api/v1/status',
      200,
      Date.now() - startTime,
      request
    )

    return response
  } catch (error) {
    const statusCode = 500
    const errorResponse = createApiError('Erro interno do servidor', 500, 'INTERNAL_ERROR')

    // Log da API em caso de erro
    if (apiKeyContext) {
      await logApiUsage(
        apiKeyContext.apiKey.id,
        'GET',
        '/api/v1/status',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro no endpoint de status:', error)
    return errorResponse
  }
}