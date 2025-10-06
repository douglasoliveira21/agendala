import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duração deve ser maior que 0'),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  categoryId: z.string().optional(),
  active: z.boolean().default(true),
  maxAdvanceBookingDays: z.number().min(1).optional(),
  minAdvanceHours: z.number().min(0).optional()
})

const listServicesSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  active: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  storeId: z.string().optional()
})

// GET /api/v1/services - Listar serviços
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'services', 'read')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = listServicesSchema.parse(queryParams)

    const skip = (validatedParams.page - 1) * validatedParams.limit

    const where: any = {}

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.store = {
        companyId: apiKeyContext.apiKey.companyId
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.storeId = apiKeyContext.apiKey.storeId
    }

    // Filtros adicionais
    if (validatedParams.storeId && !apiKeyContext.apiKey.storeId) {
      where.storeId = validatedParams.storeId
    }

    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { description: { contains: validatedParams.search, mode: 'insensitive' } }
      ]
    }

    if (validatedParams.categoryId) {
      where.categoryId = validatedParams.categoryId
    }

    if (validatedParams.active !== undefined) {
      where.active = validatedParams.active
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          price: true,
          active: true,
          maxAdvanceBookingDays: true,
          minAdvanceHours: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              appointments: true
            }
          }
        },
        skip,
        take: validatedParams.limit,
        orderBy: { name: 'asc' }
      }),
      prisma.service.count({ where })
    ])

    const response = createApiResponse({
      services,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit)
      }
    })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'GET',
      '/api/v1/services',
      200,
      Date.now() - startTime,
      request
    )

    return response
  } catch (error) {
    const statusCode = error instanceof z.ZodError ? 400 : 500
    const errorResponse = error instanceof z.ZodError 
      ? createApiError('Parâmetros inválidos', 400, 'INVALID_PARAMETERS')
      : createApiError('Erro interno do servidor', 500, 'INTERNAL_ERROR')

    // Log da API em caso de erro
    if (apiKeyContext) {
      await logApiUsage(
        apiKeyContext.apiKey.id,
        'GET',
        '/api/v1/services',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro na API de serviços:', error)
    return errorResponse
  }
}

// POST /api/v1/services - Criar serviço
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'services', 'create')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = createServiceSchema.parse(body)

    // Verificar se a API Key tem permissão para criar serviços em uma loja específica
    if (!apiKeyContext.apiKey.storeId) {
      return createApiError('API Key deve estar associada a uma loja específica para criar serviços', 400, 'STORE_REQUIRED')
    }

    // Verificar se a categoria existe (se fornecida)
    if (validatedData.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: validatedData.categoryId,
          store: {
            id: apiKeyContext.apiKey.storeId
          }
        }
      })

      if (!category) {
        return createApiError('Categoria não encontrada', 404, 'CATEGORY_NOT_FOUND')
      }
    }

    // Criar serviço
    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        duration: validatedData.duration,
        price: validatedData.price,
        categoryId: validatedData.categoryId,
        active: validatedData.active,
        maxAdvanceBookingDays: validatedData.maxAdvanceBookingDays,
        minAdvanceHours: validatedData.minAdvanceHours,
        storeId: apiKeyContext.apiKey.storeId
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        active: true,
        maxAdvanceBookingDays: true,
        minAdvanceHours: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        createdAt: true,
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    const response = createApiResponse({ service }, 201)

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'POST',
      '/api/v1/services',
      201,
      Date.now() - startTime,
      request
    )

    return response
  } catch (error) {
    const statusCode = error instanceof z.ZodError ? 400 : 500
    const errorResponse = error instanceof z.ZodError 
      ? createApiError('Dados inválidos', 400, 'INVALID_DATA')
      : createApiError('Erro interno do servidor', 500, 'INTERNAL_ERROR')

    // Log da API em caso de erro
    if (apiKeyContext) {
      await logApiUsage(
        apiKeyContext.apiKey.id,
        'POST',
        '/api/v1/services',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao criar serviço via API:', error)
    return errorResponse
  }
}