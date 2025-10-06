import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  birthDate: z.string().datetime().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
})

// GET /api/v1/clients/[clientId] - Obter cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
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

    const where: any = {
      id: clientId,
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

    const client = await prisma.user.findFirst({
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
        },
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            totalPrice: true,
            service: {
              select: {
                id: true,
                name: true,
                store: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10 // Últimos 10 agendamentos
        }
      }
    })

    if (!client) {
      return createApiError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    const response = createApiResponse({ client })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'GET',
      `/api/v1/clients/${clientId}`,
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
        `/api/v1/clients/${clientId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao obter cliente via API:', error)
    return errorResponse
  }
}

// PUT /api/v1/clients/[clientId] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'clients', 'update')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    const where: any = {
      id: clientId,
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

    // Verificar se o cliente existe
    const existingClient = await prisma.user.findFirst({
      where
    })

    if (!existingClient) {
      return createApiError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone
    }
    if (validatedData.birthDate !== undefined) {
      updateData.birthDate = new Date(validatedData.birthDate)
    }
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    // Atualizar cliente
    const client = await prisma.user.update({
      where: { id: clientId },
      data: updateData,
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
      }
    })

    const response = createApiResponse({ client })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'PUT',
      `/api/v1/clients/${clientId}`,
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
        `/api/v1/clients/${clientId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao atualizar cliente via API:', error)
    return errorResponse
  }
}

// DELETE /api/v1/clients/[clientId] - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'clients', 'delete')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const where: any = {
      id: clientId,
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

    // Verificar se o cliente existe
    const existingClient = await prisma.user.findFirst({
      where,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingClient) {
      return createApiError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    // Verificar se o cliente tem agendamentos
    if (existingClient._count.appointments > 0) {
      return createApiError(
        'Não é possível deletar cliente com agendamentos existentes',
        400,
        'CLIENT_HAS_APPOINTMENTS'
      )
    }

    // Deletar cliente
    await prisma.user.delete({
      where: { id: clientId }
    })

    const response = createApiResponse({ message: 'Cliente deletado com sucesso' })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'DELETE',
      `/api/v1/clients/${clientId}`,
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
        `/api/v1/clients/${clientId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao deletar cliente via API:', error)
    return errorResponse
  }
}