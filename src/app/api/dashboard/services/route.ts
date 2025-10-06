import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger, measurePerformance } from "@/lib/logger"
import { cache, CacheTTL } from "@/lib/cache"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/dashboard/services', undefined, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      logger.security('access_denied', ip, session?.user?.id, { 
        endpoint: '/api/dashboard/services', 
        reason: 'invalid_role',
        role: session?.user?.role
      })
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/dashboard/services', 403, duration)
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await measurePerformance('fetch_user_store', () =>
      prisma.store.findFirst({
        where: {
          ownerId: session.user.id
        }
      })
    )

    if (!store) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/dashboard/services', 404, duration, session.user.id)
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar cache
    const cacheKey = `dashboard:services:${store.id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/dashboard/services', 200, duration, session.user.id, { cached: true })
      return NextResponse.json(cached)
    }

    const services = await measurePerformance('fetch_store_services', () =>
      prisma.service.findMany({
        where: {
          storeId: store.id
        },
        include: {
          _count: {
            select: {
              appointments: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      })
    )

    const result = { services }

    // Salvar no cache
    await cache.set(cacheKey, result, CacheTTL.SHORT)

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/dashboard/services', 200, duration, session.user.id)

    return NextResponse.json(result)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/dashboard/services', error as Error, undefined)
    logger.apiResponse('GET', '/api/dashboard/services', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('POST', '/api/dashboard/services', body, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      logger.security('access_denied', ip, session?.user?.id, { 
        endpoint: '/api/dashboard/services', 
        reason: 'invalid_role',
        role: session?.user?.role
      })
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/dashboard/services', 403, duration)
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await measurePerformance('fetch_user_store', () =>
      prisma.store.findFirst({
        where: {
          ownerId: session.user.id
        }
      })
    )

    if (!store) {
      const requestDuration = Date.now() - startTime
      logger.apiResponse('POST', '/api/dashboard/services', 404, requestDuration, session.user.id)
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    const { name, description, duration, price, active = true } = body

    // Validações
    if (!name || !duration || !price) {
      const requestDuration = Date.now() - startTime
      logger.apiResponse('POST', '/api/dashboard/services', 400, requestDuration, session.user.id)
      return NextResponse.json(
        { error: "Nome, duração e preço são obrigatórios" },
        { status: 400 }
      )
    }

    if (duration <= 0 || price <= 0) {
      const requestDuration = Date.now() - startTime
      logger.apiResponse('POST', '/api/dashboard/services', 400, requestDuration, session.user.id)
      return NextResponse.json(
        { error: "Duração e preço devem ser maiores que zero" },
        { status: 400 }
      )
    }

    const service = await measurePerformance('create_service', () =>
      prisma.service.create({
        data: {
          name,
          description,
          duration: parseInt(duration),
          price: parseFloat(price),
          active,
          storeId: store.id
        }
      })
    )

    // Invalidar cache de serviços
    await cache.delPattern(`dashboard:services:${store.id}`)

    logger.info('Service created', { 
      serviceId: service.id, 
      storeId: store.id,
      userId: session.user.id, 
      serviceName: service.name,
      ip 
    })

    const requestDuration = Date.now() - startTime
    logger.apiResponse('POST', '/api/dashboard/services', 201, requestDuration, session.user.id)

    return NextResponse.json({ service }, { status: 201 })

  } catch (error) {
    const requestDuration = Date.now() - startTime
    logger.apiError('POST', '/api/dashboard/services', error as Error, undefined)
    logger.apiResponse('POST', '/api/dashboard/services', 500, requestDuration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}