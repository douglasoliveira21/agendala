import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { measurePerformance } from "@/lib/logger"
import { sanitizeName, sanitizeHtml } from "@/lib/validation"
import { z } from "zod"

const updateCouponSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: z.number().min(0, "Valor deve ser maior que zero").optional(),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  userUsageLimit: z.number().min(1).optional(),
  active: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      const duration = Date.now() - startTime
      logger.securityEvent('unauthorized_access', `/api/coupons/${couponId}`, 'Acesso não autorizado', clientIp)
      logger.apiResponse('GET', `/api/coupons/${couponId}`, 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    logger.apiRequest('GET', `/api/coupons/${couponId}`, session.user.id, clientIp, { couponId: couponId })

    const coupon = await measurePerformance('fetch_coupon_by_id', () =>
      prisma.coupon.findUnique({
        where: { id: couponId },
        include: {
          store: true,
          usages: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              appointment: {
                select: {
                  id: true,
                  date: true,
                  clientName: true
                }
              }
            },
            orderBy: { createdAt: "desc" }
          },
          _count: {
            select: {
              usages: true
            }
          }
        }
      })
    )

    if (!coupon) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', `/api/coupons/${couponId}`, 404, duration, session.user.id)
      
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem acesso
    if (session.user.role !== "ADMIN" && coupon.store.ownerId !== session.user.id) {
      const duration = Date.now() - startTime
      logger.securityEvent('access_denied', `/api/coupons/${couponId}`, 'Acesso negado ao cupom', clientIp, session.user.id)
      logger.apiResponse('GET', `/api/coupons/${couponId}`, 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/coupons/${couponId}`, 200, duration, session.user.id)

    return NextResponse.json(coupon)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', `/api/coupons/${couponId}`, error as Error, undefined)
    logger.apiResponse('GET', `/api/coupons/${couponId}`, 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      const duration = Date.now() - startTime
      logger.securityEvent('unauthorized_access', `/api/coupons/${couponId}`, 'Acesso não autorizado', clientIp)
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    logger.apiRequest('PUT', `/api/coupons/${couponId}`, session.user.id, clientIp, body)
    
    const data = updateCouponSchema.parse(body)

    // Sanitizar dados de entrada
    const sanitizedData = {
      ...data,
      name: data.name ? sanitizeName(data.name) : undefined,
      description: data.description ? sanitizeHtml(data.description) : undefined
    }

    const existingCoupon = await measurePerformance('fetch_existing_coupon', () =>
      prisma.coupon.findUnique({
        where: { id: couponId },
        include: { store: true }
      })
    )

    if (!existingCoupon) {
      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 404, duration, session.user.id)
      
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem acesso
    if (session.user.role !== "ADMIN" && existingCoupon.store.ownerId !== session.user.id) {
      const duration = Date.now() - startTime
      logger.securityEvent('access_denied', `/api/coupons/${couponId}`, 'Acesso negado ao cupom', clientIp, session.user.id)
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Validações específicas por tipo
    if (sanitizedData.type === "PERCENTAGE" && sanitizedData.value && sanitizedData.value > 100) {
      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 400, duration, session.user.id)
      
      return NextResponse.json({ error: "Desconto percentual não pode ser maior que 100%" }, { status: 400 })
    }

    if (sanitizedData.endDate && sanitizedData.startDate && new Date(sanitizedData.endDate) <= new Date(sanitizedData.startDate)) {
      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 400, duration, session.user.id)
      
      return NextResponse.json({ error: "Data de fim deve ser posterior à data de início" }, { status: 400 })
    }

    const updateData: any = { ...sanitizedData }
    if (sanitizedData.startDate) updateData.startDate = new Date(sanitizedData.startDate)
    if (sanitizedData.endDate) updateData.endDate = new Date(sanitizedData.endDate)

    const coupon = await measurePerformance('update_coupon', () =>
      prisma.coupon.update({
        where: { id: couponId },
        data: updateData,
        include: {
          _count: {
            select: {
              usages: true
            }
          }
        }
      })
    )

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/coupons/${couponId}`, 200, duration, session.user.id)

    return NextResponse.json(coupon)
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiResponse('PUT', `/api/coupons/${couponId}`, 400, duration)
      
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }

    logger.apiError('PUT', `/api/coupons/${couponId}`, error as Error, undefined)
    logger.apiResponse('PUT', `/api/coupons/${couponId}`, 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const { couponId } = await params
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      const duration = Date.now() - startTime
      logger.securityEvent('unauthorized_access', `/api/coupons/${couponId}`, 'Acesso não autorizado', clientIp)
      logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    logger.apiRequest('DELETE', `/api/coupons/${couponId}`, session.user.id, clientIp, { couponId: couponId })

    const existingCoupon = await measurePerformance('fetch_coupon_for_deletion', () =>
      prisma.coupon.findUnique({
        where: { id: couponId },
        include: { 
          store: true,
          _count: {
            select: {
              usages: true
            }
          }
        }
      })
    )

    if (!existingCoupon) {
      const duration = Date.now() - startTime
      logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 404, duration, session.user.id)
      
      return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem acesso
    if (session.user.role !== "ADMIN" && existingCoupon.store.ownerId !== session.user.id) {
      const duration = Date.now() - startTime
      logger.securityEvent('access_denied', `/api/coupons/${couponId}`, 'Acesso negado ao cupom', clientIp, session.user.id)
      logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se o cupom já foi usado
    if (existingCoupon._count.usages > 0) {
      const duration = Date.now() - startTime
      logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 400, duration, session.user.id)
      
      return NextResponse.json({ 
        error: "Não é possível deletar um cupom que já foi usado. Desative-o em vez disso." 
      }, { status: 400 })
    }

    await measurePerformance('delete_coupon', () =>
      prisma.coupon.delete({
        where: { id: couponId }
      })
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 200, duration, session.user.id)

    return NextResponse.json({ message: "Cupom deletado com sucesso" })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('DELETE', `/api/coupons/${couponId}`, error as Error, undefined)
    logger.apiResponse('DELETE', `/api/coupons/${couponId}`, 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}