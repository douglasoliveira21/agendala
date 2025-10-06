import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  birthDate: z.string().datetime().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
})

const listClientsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  email: z.string().optional()
})

// GET /api/v1/clients - Listar clientes
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
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'clients', 'read')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = listClientsSchema.parse(queryParams)

    const skip = (validatedParams.page - 1) * validatedParams.limit

    const where: any = {
      role: 'CLIENT'
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId || apiKeyContext.apiKey.storeId) {
      where.appointments = {
        some: {
          service: {
            ...(apiKeyContext.apiKey.companyId && {
              store: {
                companyId: apiKeyContext.apiKey.companyId
              }
            }),
            ...(apiKeyContext.apiKey.storeId && {
              storeId: apiKeyContext.apiKey.storeId
            })
          }
        }
      }
    }

    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { email: { contains: validatedParams.search, mode: 'insensitive' } },
        { phone: { contains: validatedParams.search, mode: 'insensitive' } }
      ]
    }

    if (validatedParams.email) {
      where.email = validatedParams.email
    }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          address: true,
          notes: true,
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const response = createApiResponse({
      clients,
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
      '/api/v1/clients',
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
        '/api/v1/clients',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro na API de clientes:', error)
    return errorResponse
  }
}

// POST /api/v1/clients - Criar cliente
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
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'clients', 'create')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Verificar se o email já existe
    const existingClient = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingClient) {
      return createApiError('Cliente com este email já existe', 409, 'CLIENT_ALREADY_EXISTS')
    }

    // Criar cliente
    const client = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        address: validatedData.address,
        notes: validatedData.notes,
        password: '', // Cliente criado via API não tem senha
        role: 'CLIENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        address: true,
        notes: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    const response = createApiResponse({ client }, 201)

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'POST',
      '/api/v1/clients',
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
        '/api/v1/clients',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao criar cliente via API:', error)
    return errorResponse
  }
}