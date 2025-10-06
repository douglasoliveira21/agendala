import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger, measurePerformance } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  let id: string
  
  try {
    const resolvedParams = await params
    id = resolvedParams.id

    logger.apiRequest('GET', `/api/service/${id}`, undefined, ip)

    const service = await measurePerformance('fetch_service_by_id', () =>
      prisma.service.findUnique({
        where: {
          id,
          active: true
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true
            }
          }
        }
      })
    )

    if (!service || !service.store.active) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', `/api/service/${id}`, 404, duration)
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/service/${id}`, 200, duration)

    return NextResponse.json({ service })
  } catch (error) {
    const duration = Date.now() - startTime
    const serviceId = id || 'unknown'
    logger.apiError('GET', `/api/service/${serviceId}`, error as Error, undefined)
    logger.apiResponse('GET', `/api/service/${serviceId}`, 500, duration)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}