import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger, measurePerformance } from "@/lib/logger"
import { sanitizeName, sanitizeHtml } from "@/lib/validation"

const createCouponSchema = z.object({
  code: z.string().min(3, "Código deve ter pelo menos 3 caracteres").max(20, "Código deve ter no máximo 20 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().min(0, "Valor deve ser maior que zero"),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  userUsageLimit: z.number().min(1).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  storeId: z.string()
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    
    logger.apiRequest('GET', '/api/coupons', session?.user?.id, clientIp)
    
    if (!session?.user) {
      logger.securityEvent('unauthorized_access', {
        endpoint: '/api/coupons',
        reason: 'No session',
        ip: clientIp
      })
      
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/coupons', 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const active = searchParams.get("active")

    if (!storeId) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/coupons', 400, duration, session.user.id)
      
      return NextResponse.json({ error: "ID da loja é obrigatório" }, { status: 400 })
    }

    // Verificar se o usuário tem acesso à loja
    const store = await measurePerformance('check_store_access', () =>
      prisma.store.findFirst({
        where: {
          id: storeId,
          OR: [
            { ownerId: session.user.id },
            { owner: { role: "ADMIN" } }
          ]
        }
      })
    )

    if (!store && session.user.role !== "ADMIN") {
      logger.securityEvent('access_denied', {
        endpoint: '/api/coupons',
        reason: 'Insufficient permissions for store',
        userId: session.user.id,
        userRole: session.user.role,
        storeId,
        ip: clientIp
      })
      
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/coupons', 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const where: any = { storeId }
    if (active !== null) {
      where.active = active === "true"
    }

    const coupons = await measurePerformance('fetch_coupons', () =>
      prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: {
              usages: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/coupons', 200, duration, session.user.id)

    return NextResponse.json(coupons)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/coupons', error as Error, session?.user?.id)
    logger.apiResponse('GET', '/api/coupons', 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    logger.apiRequest('POST', '/api/coupons', session?.user?.id, clientIp, body)
    
    if (!session?.user) {
      logger.securityEvent('unauthorized_access', {
        endpoint: '/api/coupons',
        reason: 'No session',
        ip: clientIp
      })
      
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons', 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = createCouponSchema.parse(body)

    // Sanitizar dados de entrada
    const sanitizedData = {
      ...data,
      name: sanitizeName(data.name),
      description: data.description ? sanitizeHtml(data.description) : undefined,
      code: data.code.toUpperCase().trim()
    }

    // Verificar se o usuário tem acesso à loja
    const store = await measurePerformance('check_store_access', () =>
      prisma.store.findFirst({
        where: {
          id: sanitizedData.storeId,
          OR: [
            { ownerId: session.user.id },
            { owner: { role: "ADMIN" } }
          ]
        }
      })
    )

    if (!store && session.user.role !== "ADMIN") {
      logger.securityEvent('access_denied', {
        endpoint: '/api/coupons',
        reason: 'Insufficient permissions for store',
        userId: session.user.id,
        userRole: session.user.role,
        storeId: sanitizedData.storeId,
        ip: clientIp
      })
      
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons', 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se o código já existe para esta loja
    const existingCoupon = await measurePerformance('check_coupon_code', () =>
      prisma.coupon.findFirst({
        where: {
          code: sanitizedData.code,
          storeId: sanitizedData.storeId
        }
      })
    )

    if (existingCoupon) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons', 400, duration, session.user.id)
      
      return NextResponse.json({ error: "Código do cupom já existe" }, { status: 400 })
    }

    // Validações específicas por tipo
    if (sanitizedData.type === "PERCENTAGE" && sanitizedData.value > 100) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons', 400, duration, session.user.id)
      
      return NextResponse.json({ error: "Desconto percentual não pode ser maior que 100%" }, { status: 400 })
    }

    if (sanitizedData.endDate && new Date(sanitizedData.endDate) <= new Date(sanitizedData.startDate)) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons', 400, duration, session.user.id)
      
      return NextResponse.json({ error: "Data de fim deve ser posterior à data de início" }, { status: 400 })
    }

    const coupon = await measurePerformance('create_coupon', () =>
      prisma.coupon.create({
        data: {
          ...sanitizedData,
          startDate: new Date(sanitizedData.startDate),
          endDate: sanitizedData.endDate ? new Date(sanitizedData.endDate) : null
        },
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
    logger.apiResponse('POST', '/api/coupons', 201, duration, session.user.id)

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiResponse('POST', '/api/coupons', 400, duration, session?.user?.id)
      
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }

    logger.apiError('POST', '/api/coupons', error as Error, session?.user?.id)
    logger.apiResponse('POST', '/api/coupons', 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}