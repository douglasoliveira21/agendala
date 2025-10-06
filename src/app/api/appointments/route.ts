import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addHours, addMinutes, format, parseISO } from "date-fns"
import { appointmentNotificationService } from "@/lib/appointment-notifications"
import { logger, measurePerformance } from "@/lib/logger"
import { createAppointmentSchema, sanitizePhone, sanitizeName, sanitizeHtml } from "@/lib/validation"
import { cache, CacheTTL } from "@/lib/cache"

// GET - Listar agendamentos
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/appointments', undefined, ip)
    
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    let where: any = {}

    if (session?.user.role === "STORE_OWNER") {
      // Lojista só vê agendamentos das suas lojas
      where.store = { ownerId: session.user.id }
    } else if (session?.user.role === "CLIENT") {
      // Cliente só vê seus próprios agendamentos
      where.clientId = session.user.id
    }
    // Admin vê todos

    if (storeId) {
      where.storeId = storeId
    }

    if (date) {
      const targetDate = parseISO(date)
      where.date = {
        gte: targetDate,
        lt: addHours(targetDate, 24)
      }
    }

    if (status) {
      where.status = status
    }

    // Gerar chave de cache baseada nos parâmetros de busca e usuário
    const cacheKey = `appointments:${JSON.stringify({
      userId: session?.user.id,
      role: session?.user.role,
      storeId,
      date,
      status
    })}`

    // Verificar cache primeiro
    const cached = await cache.get(cacheKey)
    if (cached) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/appointments', 200, duration, session?.user.id, { cached: true })
      return NextResponse.json(cached)
    }

    const appointments = await measurePerformance('fetch_appointments', () =>
      prisma.appointment.findMany({
        where,
        select: {
          id: true,
          date: true,
          startTime: true,
          status: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          notes: true,
          totalPrice: true,
          createdAt: true,
          updatedAt: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { date: "asc" },
          { startTime: "asc" }
        ]
      })
    )

    const result = { appointments }

    // Salvar no cache (TTL curto para dados dinâmicos)
    await cache.set(cacheKey, result, CacheTTL.SHORT)

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/appointments', 200, duration, session?.user.id)

    return NextResponse.json(result)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/appointments', error as Error, undefined)
    logger.apiResponse('GET', '/api/appointments', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar agendamento
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('POST', '/api/appointments', body, ip)
    
    // Log detalhado dos dados recebidos para debug
    console.log('🔍 DEBUG - Dados recebidos:', JSON.stringify(body, null, 2))
    
    const data = createAppointmentSchema.parse(body)
    
    // Sanitizar dados de entrada
    const sanitizedData = {
      ...data,
      clientName: sanitizeName(data.clientName),
      clientPhone: sanitizePhone(data.clientPhone),
      notes: data.notes ? sanitizeHtml(data.notes) : undefined
    }

    // Verificar se a loja existe e está ativa
    const store = await measurePerformance('fetch_store', () =>
      prisma.store.findUnique({
        where: { id: sanitizedData.storeId },
        include: { services: true }
      })
    )

    if (!store || !store.active) {
      logger.securityEvent('store_not_found', { storeId: sanitizedData.storeId, ip })
      return NextResponse.json(
        { error: "Loja não encontrada ou inativa" },
        { status: 404 }
      )
    }

    // Verificar se o serviço existe
    const service = await measurePerformance('fetch_service', () =>
      prisma.service.findUnique({
        where: { id: sanitizedData.serviceId }
      })
    )

    if (!service || !service.active || service.storeId !== sanitizedData.storeId) {
      logger.securityEvent('service_not_found', { serviceId: sanitizedData.serviceId, storeId: sanitizedData.storeId, ip })
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo" },
        { status: 404 }
      )
    }

    // Calcular horário de fim
    const [hours, minutes] = sanitizedData.startTime.split(":").map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + service.duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`

    // Verificar conflitos de horário
    const appointmentDate = parseISO(sanitizedData.date)
    const conflictingAppointment = await measurePerformance('check_conflicts', () =>
      prisma.appointment.findFirst({
        where: {
          storeId: sanitizedData.storeId,
          date: appointmentDate,
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              AND: [
                { startTime: { lte: sanitizedData.startTime } },
                { endTime: { gt: sanitizedData.startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            }
          ]
        }
      })
    )

    if (conflictingAppointment) {
      logger.appointment('conflict_detected', conflictingAppointment.id, undefined, sanitizedData.storeId)
      return NextResponse.json(
        { error: "Horário não disponível" },
        { status: 400 }
      )
    }

    // Verificar se é um usuário logado
    const session = await getServerSession(authOptions)
    let clientId = null
    
    if (session && session.user.email === sanitizedData.clientEmail) {
      clientId = session.user.id
    }

    // Validar cupom se fornecido
    let couponData = null
    let discountAmount = 0
    
    if (sanitizedData.couponId) {
      const coupon = await measurePerformance('fetch_coupon', () =>
        prisma.coupon.findUnique({
          where: { id: sanitizedData.couponId },
          include: {
            usages: {
              where: { userId: clientId || undefined }
            },
            _count: {
              select: { usages: true }
            }
          }
        })
      )

      if (!coupon || !coupon.active || coupon.storeId !== sanitizedData.storeId) {
        return NextResponse.json(
          { error: "Cupom inválido ou não aplicável a esta loja" },
          { status: 400 }
        )
      }

      // Verificar validade do cupom
      const now = new Date()
      if (coupon.startDate > now || (coupon.endDate && coupon.endDate < now)) {
        return NextResponse.json(
          { error: "Cupom fora do período de validade" },
          { status: 400 }
        )
      }

      // Verificar limite de uso total
      if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
        return NextResponse.json(
          { error: "Cupom esgotado" },
          { status: 400 }
        )
      }

      // Verificar limite de uso por usuário
      if (clientId && coupon.userUsageLimit && coupon.usages.length >= coupon.userUsageLimit) {
        return NextResponse.json(
          { error: "Limite de uso do cupom atingido para este usuário" },
          { status: 400 }
        )
      }

      // Verificar valor mínimo
      if (coupon.minAmount && service.price < coupon.minAmount) {
        return NextResponse.json(
          { error: `Valor mínimo para usar este cupom é R$ ${coupon.minAmount.toFixed(2)}` },
          { status: 400 }
        )
      }

      // Calcular desconto
      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (service.price * coupon.value) / 100
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount
        }
      } else {
        discountAmount = Math.min(coupon.value, service.price)
      }

      couponData = coupon
    }

    // Calcular preço total
    const totalPrice = service.price - discountAmount

    // Criar agendamento
    const appointment = await measurePerformance('create_appointment', () =>
      prisma.appointment.create({
        data: {
          storeId: sanitizedData.storeId,
          serviceId: sanitizedData.serviceId,
          date: appointmentDate,
          startTime: sanitizedData.startTime,
          endTime,
          clientName: sanitizedData.clientName,
          clientPhone: sanitizedData.clientPhone,
          clientEmail: sanitizedData.clientEmail,
          notes: sanitizedData.notes,
          totalPrice,
          isSimpleBooking: sanitizedData.isSimpleBooking || false,
          clientId
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              whatsappConnected: true,
              ownerId: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          }
        }
      })
    )

    logger.appointment('created', appointment.id, clientId, appointment.storeId)

    // Criar registro de uso do cupom se aplicável
    if (couponData && clientId && discountAmount > 0) {
      try {
        await measurePerformance('create_coupon_usage', () =>
          prisma.couponUsage.create({
            data: {
              userId: clientId,
              couponId: couponData.id,
              appointmentId: appointment.id,
              discountAmount
            }
          })
        )

        // Atualizar contador de uso do cupom
        await measurePerformance('update_coupon_usage_count', () =>
          prisma.coupon.update({
            where: { id: couponData.id },
            data: {
              usageCount: {
                increment: 1
              }
            }
          })
        )

        logger.appointment('coupon_applied', appointment.id, clientId, appointment.storeId)
      } catch (couponError) {
        logger.error('Erro ao registrar uso do cupom:', couponError as Error)
        // Não falhar o agendamento por causa de erro no cupom
      }
    }

    // Invalidar cache de agendamentos
    await cache.delPattern('appointments:*')

    // Enviar todas as notificações usando o novo serviço
    try {
      await appointmentNotificationService.sendAppointmentNotifications({
        id: appointment.id,
        clientName: sanitizedData.clientName,
        clientPhone: sanitizedData.clientPhone,
        clientEmail: sanitizedData.clientEmail,
        date: appointmentDate,
        startTime: sanitizedData.startTime,
        endTime: endTime,
        notes: sanitizedData.notes,
        service: {
          name: appointment.service.name,
          price: appointment.service.price,
          duration: appointment.service.duration
        },
        store: {
          id: appointment.store.id,
          name: appointment.store.name,
          phone: appointment.store.phone,
          ownerId: appointment.store.ownerId
        }
      })
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações:', notificationError as Error)
      // Não falhar o agendamento por causa de erro de notificação
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/appointments', 201, duration, session?.user.id)

    return NextResponse.json({
      message: "Agendamento criado com sucesso",
      appointment
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      // Log detalhado dos erros de validação para debug
      console.log('❌ DEBUG - Erros de validação:', JSON.stringify(error.errors, null, 2))
      
      logger.apiError('POST', '/api/appointments', error, undefined)
      logger.apiResponse('POST', '/api/appointments', 400, duration)
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('POST', '/api/appointments', error as Error, undefined)
    logger.apiResponse('POST', '/api/appointments', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}