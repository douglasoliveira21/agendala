import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('PATCH', `/api/dashboard/services/${params.id}`, body, ip)

    const session = await getServerSession(authOptions)
    const duration = Date.now() - startTime

    if (!session || session.user.role !== "STORE_OWNER") {
      logger.apiResponse('PATCH', `/api/dashboard/services/${params.id}`, 403, duration)
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Verificar se o serviço pertence ao usuário
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        store: {
          ownerId: session.user.id
        }
      }
    })

    if (!service) {
      logger.apiResponse('PATCH', `/api/dashboard/services/${params.id}`, 404, duration, session.user.id)
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    // Atualizar o serviço
    const updatedService = await prisma.service.update({
      where: { id: params.id },
      data: body
    })

    const requestDuration = Date.now() - startTime
    logger.apiResponse('PATCH', `/api/dashboard/services/${params.id}`, 200, requestDuration, session.user.id)

    return NextResponse.json({ 
      message: "Serviço atualizado com sucesso",
      service: updatedService
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('PATCH', `/api/dashboard/services/${params.id}`, error as Error, undefined)
    logger.apiResponse('PATCH', `/api/dashboard/services/${params.id}`, 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    logger.apiRequest('GET', `/api/dashboard/services/${params.id}`, undefined, ip)

    const session = await getServerSession(authOptions)
    const duration = Date.now() - startTime

    if (!session || session.user.role !== "STORE_OWNER") {
      logger.apiResponse('GET', `/api/dashboard/services/${params.id}`, 403, duration)
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Buscar o serviço
    const service = await prisma.service.findFirst({
      where: {
        id: params.id,
        store: {
          ownerId: session.user.id
        }
      },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!service) {
      logger.apiResponse('GET', `/api/dashboard/services/${params.id}`, 404, duration, session.user.id)
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    const requestDuration = Date.now() - startTime
    logger.apiResponse('GET', `/api/dashboard/services/${params.id}`, 200, requestDuration, session.user.id)

    return NextResponse.json({ service })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', `/api/dashboard/services/${params.id}`, error as Error, undefined)
    logger.apiResponse('GET', `/api/dashboard/services/${params.id}`, 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}