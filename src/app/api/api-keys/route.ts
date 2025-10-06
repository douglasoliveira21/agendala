import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger, measurePerformance } from '@/lib/logger'
import { sanitizeName, sanitizeHtml } from '@/lib/validation'
import { z } from 'zod'
import crypto from 'crypto'

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  permissions: z.record(z.any()).default({}),
  companyId: z.string().optional(),
  storeId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().min(1).max(10000).default(1000)
})

// GET /api/api-keys - Listar API Keys
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/api-keys', undefined, ip)
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      logger.securityEvent('unauthorized_access', { endpoint: '/api/api-keys', ip })
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas ADMIN e STORE_OWNER podem gerenciar API Keys
    if (!['ADMIN', 'STORE_OWNER'].includes(session.user.role)) {
      logger.securityEvent('access_denied', { 
        endpoint: '/api/api-keys', 
        userId: session.user.id, 
        role: session.user.role, 
        ip 
      })
      return Response.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId')
    const storeId = searchParams.get('storeId')

    const skip = (page - 1) * limit

    const where: any = {
      createdById: session.user.id
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (companyId) {
      where.companyId = companyId
    }

    if (storeId) {
      where.storeId = storeId
    }

    const [apiKeys, total] = await measurePerformance('fetch_api_keys', () =>
      Promise.all([
        prisma.apiKey.findMany({
          where,
          select: {
            id: true,
            name: true,
            prefix: true,
            permissions: true,
            active: true,
            lastUsedAt: true,
            expiresAt: true,
            rateLimit: true,
            companyId: true,
            storeId: true,
            company: {
              select: {
                id: true,
                name: true
              }
            },
            store: {
              select: {
                id: true,
                name: true
              }
            },
            createdAt: true,
            updatedAt: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.apiKey.count({ where })
      ])
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/api-keys', 200, duration, session.user.id)

    return Response.json({
      apiKeys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/api-keys', error as Error, undefined)
    logger.apiResponse('GET', '/api/api-keys', 500, duration)
    
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/api-keys - Criar nova API Key
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('POST', '/api/api-keys', body, ip)
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      logger.securityEvent('unauthorized_access', { endpoint: '/api/api-keys', ip })
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas ADMIN e STORE_OWNER podem criar API Keys
    if (!['ADMIN', 'STORE_OWNER'].includes(session.user.role)) {
      logger.securityEvent('access_denied', { 
        endpoint: '/api/api-keys', 
        userId: session.user.id, 
        role: session.user.role, 
        ip 
      })
      return Response.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const validatedData = createApiKeySchema.parse(body)
    
    // Sanitizar dados de entrada
    const sanitizedData = {
      ...validatedData,
      name: sanitizeName(validatedData.name),
      description: validatedData.description ? sanitizeHtml(validatedData.description) : undefined
    }

    // Verificar se o usuário tem acesso à empresa/loja especificada
    if (sanitizedData.companyId) {
      const company = await measurePerformance('check_company_access', () =>
        prisma.company.findFirst({
          where: {
            id: sanitizedData.companyId,
            OR: [
              { ownerId: session.user.id },
              {
                users: {
                  some: {
                    userId: session.user.id,
                    role: { in: ['OWNER', 'ADMIN'] }
                  }
                }
              }
            ]
          }
        })
      )

      if (!company) {
        logger.securityEvent('company_access_denied', { 
          companyId: sanitizedData.companyId, 
          userId: session.user.id, 
          ip 
        })
        return Response.json({ error: 'Empresa não encontrada ou acesso negado' }, { status: 404 })
      }
    }

    if (sanitizedData.storeId) {
      const store = await measurePerformance('check_store_access', () =>
        prisma.store.findFirst({
          where: {
            id: sanitizedData.storeId,
            ownerId: session.user.id
          }
        })
      )

      if (!store) {
        logger.securityEvent('store_access_denied', { 
          storeId: sanitizedData.storeId, 
          userId: session.user.id, 
          ip 
        })
        return Response.json({ error: 'Loja não encontrada ou acesso negado' }, { status: 404 })
      }
    }

    // Verificar limite de API Keys por usuário
    const existingKeysCount = await measurePerformance('check_api_key_limit', () =>
      prisma.apiKey.count({
        where: { createdById: session.user.id }
      })
    )

    if (existingKeysCount >= 10) {
      logger.securityEvent('api_key_limit_exceeded', { 
        userId: session.user.id, 
        currentCount: existingKeysCount, 
        ip 
      })
      return Response.json({ error: 'Limite de API Keys atingido (máximo 10)' }, { status: 400 })
    }

    // Gerar API Key
    const apiKeyValue = `sk_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`
    const hashedKey = crypto.createHash('sha256').update(apiKeyValue).digest('hex')
    const prefix = apiKeyValue.substring(0, 12) + '...'

    const apiKey = await measurePerformance('create_api_key', () =>
      prisma.apiKey.create({
        data: {
          name: sanitizedData.name,
          key: hashedKey,
          prefix,
          permissions: sanitizedData.permissions,
          companyId: sanitizedData.companyId,
          storeId: sanitizedData.storeId,
          expiresAt: sanitizedData.expiresAt ? new Date(sanitizedData.expiresAt) : null,
          rateLimit: sanitizedData.rateLimit,
          createdById: session.user.id
        },
        select: {
          id: true,
          name: true,
          prefix: true,
          permissions: true,
          active: true,
          expiresAt: true,
          rateLimit: true,
          companyId: true,
          storeId: true,
          createdAt: true
        }
      })
    )

    logger.securityEvent('api_key_created', { 
      apiKeyId: apiKey.id, 
      userId: session.user.id, 
      permissions: sanitizedData.permissions,
      ip 
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/api-keys', 201, duration, session.user.id)

    return Response.json({
      apiKey,
      key: apiKeyValue // Retorna a chave apenas na criação
    }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiError('POST', '/api/api-keys', error, undefined)
      logger.apiResponse('POST', '/api/api-keys', 400, duration)
      return Response.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    logger.apiError('POST', '/api/api-keys', error as Error, undefined)
    logger.apiResponse('POST', '/api/api-keys', 500, duration)
    
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}