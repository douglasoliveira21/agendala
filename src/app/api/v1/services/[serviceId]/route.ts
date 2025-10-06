import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  active: z.boolean().optional(),
  maxAdvanceBookingDays: z.number().min(1).optional(),
  minAdvanceHours: z.number().min(0).optional()
})

// GET /api/v1/services/[serviceId] - Obter serviço específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params
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

    const where: any = {
      id: serviceId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.store = {
        companyId: apiKeyContext.apiKey.companyId
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.storeId = apiKeyContext.apiKey.storeId
    }

    const service = await prisma.service.findFirst({
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
            slug: true,
            workingHours: true,
            advanceBookingDays: true,
            minAdvanceHours: true
          }
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            appointments: true
          }
        },
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            clientName: true,
            totalPrice: true
          },
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            date: { gte: new Date() }
          },
          orderBy: { date: 'asc' },
          take: 10 // Próximos 10 agendamentos
        }
      }
    })

    if (!service) {
      return createApiError('Serviço não encontrado', 404, 'SERVICE_NOT_FOUND')
    }

    const response = createApiResponse({ service })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'GET',
      `/api/v1/services/${serviceId}`,
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
        `/api/v1/services/${serviceId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao obter serviço via API:', error)
    return errorResponse
  }
}

// PUT /api/v1/services/[serviceId] - Atualizar serviço
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'services', 'update')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = updateServiceSchema.parse(body)

    const where: any = {
      id: serviceId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.store = {
        companyId: apiKeyContext.apiKey.companyId
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.storeId = apiKeyContext.apiKey.storeId
    }

    // Verificar se o serviço existe
    const existingService = await prisma.service.findFirst({
      where
    })

    if (!existingService) {
      return createApiError('Serviço não encontrado', 404, 'SERVICE_NOT_FOUND')
    }

    // Verificar se a categoria existe (se fornecida)
    if (validatedData.categoryId) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: validatedData.categoryId,
          store: {
            id: existingService.storeId
          }
        }
      })

      if (!category) {
        return createApiError('Categoria não encontrada', 404, 'CATEGORY_NOT_FOUND')
      }
    }

    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.duration !== undefined) {
      updateData.duration = validatedData.duration
    }
    if (validatedData.price !== undefined) {
      updateData.price = validatedData.price
    }
    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId
    }
    if (validatedData.active !== undefined) {
      updateData.active = validatedData.active
    }
    if (validatedData.maxAdvanceBookingDays !== undefined) {
      updateData.maxAdvanceBookingDays = validatedData.maxAdvanceBookingDays
    }
    if (validatedData.minAdvanceHours !== undefined) {
      updateData.minAdvanceHours = validatedData.minAdvanceHours
    }

    // Atualizar serviço
    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
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
      }
    })

    const response = createApiResponse({ service })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'PUT',
      `/api/v1/services/${serviceId}`,
      200,
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
        'PUT',
        `/api/v1/services/${serviceId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao atualizar serviço via API:', error)
    return errorResponse
  }
}

// DELETE /api/v1/services/[serviceId] - Deletar serviço
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'services', 'delete')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const where: any = {
      id: serviceId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.store = {
        companyId: apiKeyContext.apiKey.companyId
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.storeId = apiKeyContext.apiKey.storeId
    }

    // Verificar se o serviço existe
    const existingService = await prisma.service.findFirst({
      where,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingService) {
      return createApiError('Serviço não encontrado', 404, 'SERVICE_NOT_FOUND')
    }

    // Verificar se o serviço tem agendamentos
    if (existingService._count.appointments > 0) {
      return createApiError(
        'Não é possível deletar serviço com agendamentos existentes',
        400,
        'SERVICE_HAS_APPOINTMENTS'
      )
    }

    // Deletar serviço
    await prisma.service.delete({
      where: { id: serviceId }
    })

    const response = createApiResponse({ message: 'Serviço deletado com sucesso' })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'DELETE',
      `/api/v1/services/${serviceId}`,
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
        'DELETE',
        `/api/v1/services/${serviceId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao deletar serviço via API:', error)
    return errorResponse
  }
}