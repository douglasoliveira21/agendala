import { NextRequest } from 'next/server'
import { validateApiKey, logApiUsage, hasPermission, createApiResponse, createApiError } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, 'ID do serviço é obrigatório'),
  clientEmail: z.string().email('Email inválido'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  clientPhone: z.string().min(1, 'Telefone do cliente é obrigatório'),
  date: z.string().datetime('Data inválida'),
  notes: z.string().optional(),
  sendNotifications: z.boolean().default(true)
})

const listAppointmentsSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  serviceId: z.string().optional(),
  clientEmail: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET /api/v1/appointments - Listar agendamentos
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
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'appointments', 'read')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = listAppointmentsSchema.parse(queryParams)

    const skip = (validatedParams.page - 1) * validatedParams.limit

    const where: any = {}

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

    if (validatedParams.status) {
      where.status = validatedParams.status
    }

    if (validatedParams.serviceId) {
      where.serviceId = validatedParams.serviceId
    }

    if (validatedParams.clientEmail) {
      where.clientEmail = validatedParams.clientEmail
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      where.date = {}
      if (validatedParams.startDate) {
        where.date.gte = new Date(validatedParams.startDate)
      }
      if (validatedParams.endDate) {
        where.date.lte = new Date(validatedParams.endDate)
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
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
        },
        skip,
        take: validatedParams.limit,
        orderBy: { date: 'desc' }
      }),
      prisma.appointment.count({ where })
    ])

    const response = createApiResponse({
      appointments,
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
      '/api/v1/appointments',
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
        '/api/v1/appointments',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro na API de agendamentos:', error)
    return errorResponse
  }
}

// POST /api/v1/appointments - Criar agendamento
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
    if (!hasPermission(apiKeyContext.apiKey.permissions, 'appointments', 'create')) {
      return createApiError('Permissão insuficiente', 403, 'INSUFFICIENT_PERMISSION')
    }

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // Verificar se o serviço existe e pertence à empresa/loja da API Key
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        ...(apiKeyContext.apiKey.companyId && {
          store: {
            companyId: apiKeyContext.apiKey.companyId
          }
        }),
        ...(apiKeyContext.apiKey.storeId && {
          storeId: apiKeyContext.apiKey.storeId
        })
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            workingHours: true,
            advanceBookingDays: true,
            minAdvanceHours: true
          }
        }
      }
    })

    if (!service) {
      return createApiError('Serviço não encontrado', 404, 'SERVICE_NOT_FOUND')
    }

    const appointmentDate = new Date(validatedData.date)
    const now = new Date()

    // Verificar se a data não é no passado
    if (appointmentDate <= now) {
      return createApiError('Data do agendamento deve ser no futuro', 400, 'INVALID_DATE')
    }

    // Verificar antecedência mínima
    const minAdvanceMs = service.store.minAdvanceHours * 60 * 60 * 1000
    if (appointmentDate.getTime() - now.getTime() < minAdvanceMs) {
      return createApiError(
        `Agendamento deve ser feito com pelo menos ${service.store.minAdvanceHours} horas de antecedência`,
        400,
        'INSUFFICIENT_ADVANCE_TIME'
      )
    }

    // Verificar limite de dias para agendamento
    const maxAdvanceMs = service.store.advanceBookingDays * 24 * 60 * 60 * 1000
    if (appointmentDate.getTime() - now.getTime() > maxAdvanceMs) {
      return createApiError(
        `Agendamento não pode ser feito com mais de ${service.store.advanceBookingDays} dias de antecedência`,
        400,
        'EXCESSIVE_ADVANCE_TIME'
      )
    }

    // Verificar disponibilidade do horário
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        serviceId: validatedData.serviceId,
        date: appointmentDate,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })

    if (existingAppointment) {
      return createApiError('Horário não disponível', 409, 'TIME_SLOT_UNAVAILABLE')
    }

    // Buscar ou criar cliente
    let client = await prisma.user.findUnique({
      where: { email: validatedData.clientEmail }
    })

    if (!client) {
      client = await prisma.user.create({
        data: {
          email: validatedData.clientEmail,
          name: validatedData.clientName,
          phone: validatedData.clientPhone,
          password: '', // Cliente criado via API não tem senha
          role: 'CLIENT'
        }
      })
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        serviceId: validatedData.serviceId,
        clientId: client.id,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientPhone: validatedData.clientPhone,
        date: appointmentDate,
        totalPrice: service.price,
        notes: validatedData.notes,
        status: 'PENDING'
      },
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
        createdAt: true
      }
    })

    const response = createApiResponse({ appointment }, 201)

    // Log da API
    await logApiUsage(
      apiKeyContext.apiKey.id,
      'POST',
      '/api/v1/appointments',
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
        '/api/v1/appointments',
        statusCode,
        Date.now() - startTime,
        request
      )
    }

    console.error('Erro ao criar agendamento via API:', error)
    return errorResponse
  }
}