import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { measurePerformance } from "@/lib/logger"
import { z } from "zod"

const validateCouponSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  storeId: z.string().min(1, "ID da loja é obrigatório"),
  amount: z.number().min(0, "Valor deve ser maior que zero"),
  userId: z.string().optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      const duration = Date.now() - startTime
      logger.securityEvent('unauthorized_access', '/api/coupons/validate', 'Acesso não autorizado', clientIp)
      logger.apiResponse('POST', '/api/coupons/validate', 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    
    logger.apiRequest('POST', '/api/coupons/validate', session.user.id, clientIp, body)
    
    const { code, storeId, amount, userId } = validateCouponSchema.parse(body)

    // Buscar o cupom
    const coupon = await measurePerformance('find_coupon', () =>
      prisma.coupon.findFirst({
        where: {
          code: code.toUpperCase(),
          storeId,
          active: true
        },
        include: {
          usages: userId ? {
            where: { userId }
          } : undefined,
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
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom não encontrado ou inativo" 
      }, { status: 400 })
    }

    const now = new Date()

    // Verificar se o cupom está dentro do período válido
    if (coupon.startDate > now) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom ainda não está válido" 
      }, { status: 400 })
    }

    if (coupon.endDate && coupon.endDate < now) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom expirado" 
      }, { status: 400 })
    }

    // Verificar limite de uso total
    if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: "Cupom esgotado" 
      }, { status: 400 })
    }

    // Verificar limite de uso por usuário
    if (userId && coupon.userUsageLimit && coupon.usages && coupon.usages.length >= coupon.userUsageLimit) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: "Você já atingiu o limite de uso deste cupom" 
      }, { status: 400 })
    }

    // Verificar valor mínimo
    if (coupon.minAmount && amount < coupon.minAmount) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration, session.user.id)
      
      return NextResponse.json({ 
        valid: false, 
        error: `Valor mínimo para usar este cupom é R$ ${coupon.minAmount.toFixed(2)}` 
      }, { status: 400 })
    }

    // Calcular desconto
    let discountAmount = 0
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (amount * coupon.value) / 100
      // Aplicar desconto máximo se definido
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      discountAmount = coupon.value
    }

    // Garantir que o desconto não seja maior que o valor total
    if (discountAmount > amount) {
      discountAmount = amount
    }

    const finalAmount = amount - discountAmount

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/coupons/validate', 200, duration, session.user.id)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value
      },
      discount: {
        amount: discountAmount,
        percentage: (discountAmount / amount) * 100
      },
      originalAmount: amount,
      finalAmount,
      savings: discountAmount
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiResponse('POST', '/api/coupons/validate', 400, duration)
      
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }

    logger.apiError('POST', '/api/coupons/validate', error as Error, undefined)
    logger.apiResponse('POST', '/api/coupons/validate', 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}