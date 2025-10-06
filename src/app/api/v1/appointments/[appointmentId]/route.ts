import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().min(1).optional()
})

// GET /api/v1/appointments/[appointmentId] - Obter agendamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'appointments', 'read')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const where: any = {
      id: appointmentId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.service = {
        store: {
          companyId: apiKeyContext.apiKey.companyId
        }
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.service = {
        storeId: apiKeyContext.apiKey.storeId
      }
    }

    const appointment = await prisma.appointment.findFirst({
      where,
      select: {
        id: true,
        date: true,
        status: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        notes: true,
        totalPrice: true,
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (!appointment) {
      return createApiError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    const response = createApiResponse({ appointment })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'GET',
      `/api/v1/appointments/${params.appointmentId}`,
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
        'PUT',
        `/api/v1/appointments/${appointmentId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao obter agendamento via API:', error)
    return errorResponse
  }
}

// PUT /api/v1/appointments/[appointmentId] - Atualizar agendamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'appointments', 'update')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    const where: any = {
      id: appointmentId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.service = {
        store: {
          companyId: apiKeyContext.apiKey.companyId
        }
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.service = {
        storeId: apiKeyContext.apiKey.storeId
      }
    }

    // Verificar se o agendamento existe
    const existingAppointment = await prisma.appointment.findFirst({
      where,
      include: {
        service: {
          include: {
            store: {
              select: {
                minAdvanceHours: true,
                advanceBookingDays: true
              }
            }
          }
        }
      }
    })

    if (!existingAppointment) {
      return createApiError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    const updateData: any = {}

    // Validar mudança de data se fornecida
    if (validatedData.date) {
      const newDate = new Date(validatedData.date)
      const now = new Date()

      // Verificar se a data não é no passado
      if (newDate <= now) {
        return createApiError('Data do agendamento deve ser no futuro', 400, 'INVALID_DATE')
      }

      // Verificar antecedência mínima
      const minAdvanceMs = existingAppointment.service.store.minAdvanceHours * 60 * 60 * 1000
      if (newDate.getTime() - now.getTime() < minAdvanceMs) {
        return createApiError(
          `Agendamento deve ser feito com pelo menos ${existingAppointment.service.store.minAdvanceHours} horas de antecedência`,
          400,
          'INSUFFICIENT_ADVANCE_TIME'
        )
      }

      // Verificar limite de dias para agendamento
      const maxAdvanceMs = existingAppointment.service.store.advanceBookingDays * 24 * 60 * 60 * 1000
      if (newDate.getTime() - now.getTime() > maxAdvanceMs) {
        return createApiError(
          `Agendamento não pode ser feito com mais de ${existingAppointment.service.store.advanceBookingDays} dias de antecedência`,
          400,
          'EXCESSIVE_ADVANCE_TIME'
        )
      }

      // Verificar disponibilidade do novo horário
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          serviceId: existingAppointment.serviceId,
          date: newDate,
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: appointmentId }
        }
      })

      if (conflictingAppointment) {
        return createApiError('Horário não disponível', 409, 'TIME_SLOT_UNAVAILABLE')
      }

      updateData.date = newDate
    }

    // Adicionar outros campos de atualização
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }
    if (validatedData.clientName !== undefined) {
      updateData.clientName = validatedData.clientName
    }
    if (validatedData.clientPhone !== undefined) {
      updateData.clientPhone = validatedData.clientPhone
    }

    // Atualizar agendamento
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      select: {
        id: true,
        date: true,
        status: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        notes: true,
        totalPrice: true,
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    const response = createApiResponse({ appointment })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'PUT',
      `/api/v1/appointments/${appointmentId}`,
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
        'GET',
        `/api/v1/appointments/${appointmentId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao atualizar agendamento via API:', error)
    return errorResponse
  }
}

// DELETE /api/v1/appointments/[appointmentId] - Cancelar agendamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  const startTime = Date.now()
  let apiKeyContext: any = null

  try {
    // Validar API Key
    apiKeyContext = await validateApiKey(request)
    if (!apiKeyContext) {
      return createApiError('API Key inválida ou expirada', 401, 'INVALID_API_KEY')
    }

    // Verificar permissões
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'appointments', 'delete')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const where: any = {
      id: appointmentId
    }

    // Filtrar por empresa/loja se especificado na API Key
    if (apiKeyContext.apiKey.companyId) {
      where.service = {
        store: {
          companyId: apiKeyContext.apiKey.companyId
        }
      }
    } else if (apiKeyContext.apiKey.storeId) {
      where.service = {
        storeId: apiKeyContext.apiKey.storeId
      }
    }

    // Verificar se o agendamento existe
    const existingAppointment = await prisma.appointment.findFirst({
      where
    })

    if (!existingAppointment) {
      return createApiError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    // Cancelar agendamento (não deletar, apenas marcar como cancelado)
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
      select: {
        id: true,
        date: true,
        status: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        notes: true,
        totalPrice: true,
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    const response = createApiResponse({ appointment })

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'DELETE',
      `/api/v1/appointments/${appointmentId}`,
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
        `/api/v1/appointments/${appointmentId}`,
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao cancelar agendamento via API:', error)
    return errorResponse
  }
}