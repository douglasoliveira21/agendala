import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/api-keys/[keyId]/logs - Obter logs de uso da API Key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a API Key existe e pertence ao usuário
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        createdById: session.user.id
      }
    })

    if (!apiKey) {
      return Response.json({ error: 'API Key não encontrada' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const method = searchParams.get('method')
    const statusCode = searchParams.get('statusCode')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    const where: any = {
      apiKeyId: keyId
    }

    if (method) {
      where.method = method
    }

    if (statusCode) {
      where.statusCode = parseInt(statusCode)
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where,
        select: {
          id: true,
          method: true,
          endpoint: true,
          statusCode: true,
          responseTime: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.apiUsageLog.count({ where })
    ])

    // Estatísticas dos logs
    const stats = await prisma.apiUsageLog.groupBy({
      by: ['statusCode'],
      where: {
        apiKeyId: keyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      _count: {
        statusCode: true
      }
    })

    const avgResponseTime = await prisma.apiUsageLog.aggregate({
      where: {
        apiKeyId: keyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _avg: {
        responseTime: true
      }
    })

    return Response.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        statusCodes: stats.reduce((acc, stat) => {
          acc[stat.statusCode] = stat._count.statusCode
          return acc
        }, {} as Record<number, number>),
        avgResponseTime: avgResponseTime._avg.responseTime || 0
      }
    })
  } catch (error) {
    console.error('Erro ao obter logs da API Key:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}