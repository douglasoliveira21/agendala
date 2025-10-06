import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '6months'
    const storeId = searchParams.get('storeId')
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    // Calcular período
    const now = new Date()
    let startDate: Date
    let endDate: Date = endDateParam ? new Date(endDateParam) : now
    
    if (startDateParam) {
      startDate = new Date(startDateParam)
    } else {
      switch (period) {
        case '1month':
          startDate = startOfMonth(now)
          break
        case '3months':
          startDate = startOfMonth(subMonths(now, 2))
          break
        case '6months':
          startDate = startOfMonth(subMonths(now, 5))
          break
        case '1year':
          startDate = startOfMonth(subMonths(now, 11))
          break
        default:
          startDate = subDays(endDate, 30)
      }
    }

    // Buscar loja do usuário
    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Buscar agendamentos do período
    const appointments = await prisma.appointment.findMany({
      where: {
        storeId: store.id,
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        }
      },
      include: {
        service: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Calcular estatísticas gerais
    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED').length
    const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length
    const totalRevenue = appointments
      .filter(apt => apt.status === 'COMPLETED')
      .reduce((sum, apt) => sum + apt.service.price, 0)

    const averageTicket = completedAppointments > 0 ? totalRevenue / completedAppointments : 0
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0

    // Estatísticas por serviço
    const serviceStats = appointments.reduce((acc, apt) => {
      const serviceName = apt.service.name
      if (!acc[serviceName]) {
        acc[serviceName] = {
          serviceName,
          totalAppointments: 0,
          completedAppointments: 0,
          totalRevenue: 0,
          prices: []
        }
      }
      
      acc[serviceName].totalAppointments++
      acc[serviceName].prices.push(apt.service.price)
      
      if (apt.status === 'COMPLETED') {
        acc[serviceName].completedAppointments++
        acc[serviceName].totalRevenue += apt.service.price
      }
      
      return acc
    }, {} as Record<string, any>)

    const serviceStatsArray = Object.values(serviceStats).map((service: any) => ({
      serviceName: service.serviceName,
      totalAppointments: service.totalAppointments,
      totalRevenue: service.totalRevenue,
      averagePrice: service.prices.reduce((sum: number, price: number) => sum + price, 0) / service.prices.length,
      completionRate: service.totalAppointments > 0 ? (service.completedAppointments / service.totalAppointments) * 100 : 0
    }))

    // Serviço mais popular
    const topService = serviceStatsArray.reduce((top, current) => 
      current.totalAppointments > (top?.totalAppointments || 0) ? current : top
    , serviceStatsArray[0] || { name: 'Nenhum', count: 0 })

    // Estatísticas por dia da semana
    const dayStats = appointments.reduce((acc, apt) => {
      const dayName = format(apt.date, 'EEEE', { locale: ptBR })
      acc[dayName] = (acc[dayName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const busyDay = Object.entries(dayStats).reduce((busy, [day, count]) => 
      count > (busy?.count || 0) ? { day, count } : busy
    , { day: 'Nenhum', count: 0 })

    // Estatísticas diárias
    const dailyStats: Array<{
      date: string
      appointments: number
      revenue: number
      completedAppointments: number
      cancelledAppointments: number
    }> = []

    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayAppointments = appointments.filter(apt => 
        format(apt.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      )
      
      const dayCompleted = dayAppointments.filter(apt => apt.status === 'COMPLETED')
      const dayCancelled = dayAppointments.filter(apt => apt.status === 'CANCELLED')
      const dayRevenue = dayCompleted.reduce((sum, apt) => sum + apt.service.price, 0)

      dailyStats.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        appointments: dayAppointments.length,
        revenue: dayRevenue,
        completedAppointments: dayCompleted.length,
        cancelledAppointments: dayCancelled.length
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Estatísticas mensais para gráficos
    const monthlyStats: Array<{
      month: string
      appointments: number
      revenue: number
      completedAppointments: number
      cancelledAppointments: number
    }> = []

    const monthDate = new Date(startDate)
    while (monthDate <= endDate) {
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      
      const monthAppointments = appointments.filter(apt => 
        apt.date >= monthStart && apt.date <= monthEnd
      )
      
      const monthCompleted = monthAppointments.filter(apt => apt.status === 'COMPLETED')
      const monthCancelled = monthAppointments.filter(apt => apt.status === 'CANCELLED')
      const monthRevenue = monthCompleted.reduce((sum, apt) => sum + apt.service.price, 0)

      monthlyStats.push({
        month: format(monthStart, 'MMM yyyy', { locale: ptBR }),
        appointments: monthAppointments.length,
        revenue: monthRevenue,
        completedAppointments: monthCompleted.length,
        cancelledAppointments: monthCancelled.length
      })

      monthDate.setMonth(monthDate.getMonth() + 1)
    }

    // Comparação mensal
    const currentMonth = new Date()
    const previousMonth = subMonths(currentMonth, 1)

    const currentMonthAppointments = await prisma.appointment.count({
      where: {
        storeId: store.id,
        date: {
          gte: startOfMonth(currentMonth),
          lte: endOfMonth(currentMonth)
        }
      }
    })

    const previousMonthAppointments = await prisma.appointment.count({
      where: {
        storeId: store.id,
        date: {
          gte: startOfMonth(previousMonth),
          lte: endOfMonth(previousMonth)
        }
      }
    })

    const currentMonthCompletedAppointments = await prisma.appointment.findMany({
      where: {
        storeId: store.id,
        status: 'COMPLETED',
        date: {
          gte: startOfMonth(currentMonth),
          lte: endOfMonth(currentMonth)
        }
      },
      include: {
        service: {
          select: {
            price: true
          }
        }
      }
    })

    const previousMonthCompletedAppointments = await prisma.appointment.findMany({
      where: {
        storeId: store.id,
        status: 'COMPLETED',
        date: {
          gte: startOfMonth(previousMonth),
          lte: endOfMonth(previousMonth)
        }
      },
      include: {
        service: {
          select: {
            price: true
          }
        }
      }
    })

    const currentMonthRevenue = currentMonthCompletedAppointments.reduce((sum, apt) => sum + apt.service.price, 0)
    const previousMonthRevenue = previousMonthCompletedAppointments.reduce((sum, apt) => sum + apt.service.price, 0)

    // Calcular crescimento
    const appointmentGrowth = previousMonthAppointments > 0 
      ? ((currentMonthAppointments - previousMonthAppointments) / previousMonthAppointments) * 100 
      : 0

    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0

    const reportData = {
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
        type: period
      },
      summary: {
        totalAppointments,
        totalRevenue,
        averageTicket,
        completionRate,
        cancellationRate,
        topService: {
          name: topService?.serviceName || 'Nenhum',
          count: topService?.totalAppointments || 0
        },
        busyDay
      },
      charts: {
        dailyStats,
        monthlyStats,
        serviceStats: serviceStatsArray,
        statusDistribution: [
          { name: 'Concluídos', value: completedAppointments, color: '#10b981' },
          { name: 'Cancelados', value: cancelledAppointments, color: '#ef4444' },
          { name: 'Agendados', value: totalAppointments - completedAppointments - cancelledAppointments, color: '#3b82f6' }
        ]
      },
      monthlyComparison: {
        currentMonth: {
          appointments: currentMonthAppointments,
          revenue: currentMonthRevenue
        },
        previousMonth: {
          appointments: previousMonthAppointments,
          revenue: previousMonthRevenue
        },
        growth: {
          appointments: Math.round(appointmentGrowth),
          revenue: Math.round(revenueGrowth)
        }
      }
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Erro ao gerar relatórios:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}