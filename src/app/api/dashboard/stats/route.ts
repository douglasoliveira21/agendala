import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger, measurePerformance } from "@/lib/logger"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/dashboard/stats', undefined, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      logger.securityEvent('access_denied', 'insufficient_permissions', {
        endpoint: '/api/dashboard/stats',
        reason: 'not_store_owner',
        role: session?.user?.role,
        ip
      })
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/dashboard/stats', 403, duration)
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await measurePerformance('fetch_store_for_stats', () =>
      prisma.store.findFirst({
        where: {
          ownerId: session.user.id
        },
        include: {
          category: {
            select: {
              name: true
            }
          }
        }
      })
    )

    if (!store) {
      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/dashboard/stats', 404, duration)
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Data de hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Primeiro dia do mês atual
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Buscar estatísticas
    const [
      totalAppointments,
      todayAppointments,
      totalServices,
      activeServices,
      monthlyAppointments
    ] = await measurePerformance('fetch_dashboard_stats', () =>
      Promise.all([
        // Total de agendamentos
        prisma.appointment.count({
          where: {
            storeId: store.id
          }
        }),
        
        // Agendamentos de hoje
        prisma.appointment.count({
          where: {
            storeId: store.id,
            date: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        
        // Total de serviços
        prisma.service.count({
          where: {
            storeId: store.id
          }
        }),
        
        // Serviços ativos
        prisma.service.count({
          where: {
            storeId: store.id,
            active: true
          }
        }),
        
        // Agendamentos do mês com preços
        prisma.appointment.findMany({
          where: {
            storeId: store.id,
            date: {
              gte: firstDayOfMonth
            }
          },
          select: {
            id: true,
            date: true,
            totalPrice: true,
            service: {
              select: {
                price: true
              }
            }
          }
        })
      ])
    )

    // Calcular receitas
    const totalRevenue = monthlyAppointments.reduce((sum, appointment) => {
      return sum + (appointment.totalPrice || appointment.service?.price || 0)
    }, 0)

    const monthlyRevenue = monthlyAppointments
      .filter(appointment => appointment.date >= firstDayOfMonth)
      .reduce((sum, appointment) => {
        return sum + (appointment.totalPrice || appointment.service?.price || 0)
      }, 0)

    const stats = {
      totalAppointments,
      todayAppointments,
      totalRevenue,
      monthlyRevenue,
      totalServices,
      activeServices,
      storeInfo: {
        name: store.name,
        active: store.active,
        category: store.category?.name || "Sem categoria"
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/dashboard/stats', 200, duration, session.user.id)

    return NextResponse.json({ stats })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/dashboard/stats', error as Error, undefined)
    logger.apiResponse('GET', '/api/dashboard/stats', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}