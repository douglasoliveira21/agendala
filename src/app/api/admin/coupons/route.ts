import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/admin/coupons', undefined, clientIp)

    const session = await getServerSession(authOptions)
    
    if (!session) {
      const duration = Date.now() - startTime
      logger.securityEvent('unauthorized_access', '/api/admin/coupons', 'Tentativa de acesso sem autenticação', clientIp)
      logger.apiResponse('GET', '/api/admin/coupons', 401, duration)
      
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== "ADMIN") {
      const duration = Date.now() - startTime
      logger.securityEvent('access_denied', '/api/admin/coupons', 'Acesso negado - não é admin', clientIp, session.user.id)
      logger.apiResponse('GET', '/api/admin/coupons', 403, duration, session.user.id)
      
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Buscar todos os cupons do sistema
    const coupons = await prisma.coupon.findMany({
      include: {
        store: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            usages: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/coupons', 200, duration, session.user.id)

    return NextResponse.json(coupons)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/admin/coupons', error as Error, undefined)
    logger.apiResponse('GET', '/api/admin/coupons', 500, duration)
    
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}