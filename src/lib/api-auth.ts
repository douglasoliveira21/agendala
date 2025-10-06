import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import crypto from 'crypto'

export interface ApiKeyContext {
  apiKey: {
    id: string
    name: string
    permissions: any
    companyId?: string
    storeId?: string
    createdById: string
  }
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // Remove "Bearer "
  
  if (!token) {
    return null
  }

  try {
    // Hash da API key para comparação
    const hashedKey = crypto.createHash('sha256').update(token).digest('hex')
    
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: hashedKey,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        companyId: true,
        storeId: true,
        createdById: true,
        rateLimit: true,
        lastUsedAt: true
      }
    })

    if (!apiKey) {
      return null
    }

    // Verificar rate limiting (requests por hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsage = await prisma.apiUsageLog.count({
      where: {
        apiKeyId: apiKey.id,
        createdAt: { gte: oneHourAgo }
      }
    })

    if (recentUsage >= apiKey.rateLimit) {
      throw new Error('Rate limit exceeded')
    }

    // Atualizar último uso
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    })

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        companyId: apiKey.companyId || undefined,
        storeId: apiKey.storeId || undefined,
        createdById: apiKey.createdById
      }
    }
  } catch (error) {
    console.error('API Key validation error:', error)
    return null
  }
}

export async function logApiUsage(
  apiKeyId: string,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  request: NextRequest
) {
  try {
    await prisma.apiUsageLog.create({
      data: {
        apiKeyId,
        method,
        endpoint,
        statusCode,
        responseTime,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}

export function hasPermission(permissions: any, resource: string, action: string): boolean {
  if (!permissions || typeof permissions !== 'object') {
    return false
  }

  // Verificar se tem permissão de admin (acesso total)
  if (permissions.admin === true) {
    return true
  }

  // Verificar permissão específica do recurso
  const resourcePermissions = permissions[resource]
  if (!resourcePermissions) {
    return false
  }

  // Se for um array de ações permitidas
  if (Array.isArray(resourcePermissions)) {
    return resourcePermissions.includes(action) || resourcePermissions.includes('*')
  }

  // Se for um objeto com ações específicas
  if (typeof resourcePermissions === 'object') {
    return resourcePermissions[action] === true || resourcePermissions['*'] === true
  }

  // Se for true, permite todas as ações
  return resourcePermissions === true
}

export function createApiResponse(data: any, status: number = 200) {
  return Response.json(data, { status })
}

export function createApiError(message: string, status: number = 400, code?: string) {
  return Response.json({
    error: {
      message,
      code: code || 'API_ERROR',
      status
    }
  }, { status })
}