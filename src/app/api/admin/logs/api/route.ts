import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const method = searchParams.get("method")
    const endpoint = searchParams.get("endpoint")
    const statusCode = searchParams.get("statusCode")
    const apiKeyId = searchParams.get("apiKeyId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (method && method !== "all") {
      where.method = method
    }

    if (endpoint) {
      where.endpoint = {
        contains: endpoint,
        mode: "insensitive"
      }
    }

    if (statusCode && statusCode !== "all") {
      where.statusCode = parseInt(statusCode)
    }

    if (apiKeyId && apiKeyId !== "all") {
      where.apiKeyId = apiKeyId
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate)
      }
    }

    // Buscar logs com paginação
    const [logs, total] = await Promise.all([
      prisma.apiUsageLog.findMany({
        where,
        include: {
          apiKey: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.apiUsageLog.count({ where })
    ])

    // Formatar dados para corresponder à interface esperada
    const formattedLogs = logs.map(log => ({
      id: log.id,
      method: log.method,
      endpoint: log.endpoint,
      statusCode: log.statusCode,
      responseTime: log.responseTime,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      apiKey: {
        id: log.apiKey.id,
        name: log.apiKey.name,
        description: "", // Não existe no modelo atual
        user: {
          id: log.apiKey.createdBy.id,
          name: log.apiKey.createdBy.name,
          email: log.apiKey.createdBy.email
        }
      }
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      },
      stats: {
        totalRequests: total,
        averageResponseTime: logs.length > 0 
          ? Math.round(logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length)
          : 0,
        statusCodes: logs.reduce((acc, log) => {
          acc[log.statusCode.toString()] = (acc[log.statusCode.toString()] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error) {
    console.error("Erro ao buscar logs de API:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}