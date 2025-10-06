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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const reportType = searchParams.get("type") || "overview"

    // Definir período padrão (último mês)
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1)

    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : defaultEndDate
    }

    switch (reportType) {
      case "overview":
        return await getOverviewReport(dateFilter)
      case "appointments":
        return await getAppointmentsReport(dateFilter)
      case "revenue":
        return await getRevenueReport(dateFilter)
      case "stores":
        return await getStoresReport(dateFilter)
      case "users":
        return await getUsersReport(dateFilter)
      default:
        return NextResponse.json(
          { error: "Tipo de relatório inválido" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

async function getOverviewReport(dateFilter: any) {
  const [
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    totalRevenue,
    totalUsers,
    totalStores,
    activeStores
  ] = await Promise.all([
    prisma.appointment.count({
      where: { createdAt: dateFilter }
    }),
    prisma.appointment.count({
      where: { 
        createdAt: dateFilter,
        status: "COMPLETED"
      }
    }),
    prisma.appointment.count({
      where: { 
        createdAt: dateFilter,
        status: "CANCELLED"
      }
    }),
    prisma.appointment.aggregate({
      where: { 
        createdAt: dateFilter,
        status: "COMPLETED"
      },
      _sum: { totalPrice: true }
    }),
    prisma.user.count({
      where: { createdAt: dateFilter }
    }),
    prisma.store.count({
      where: { createdAt: dateFilter }
    }),
    prisma.store.count({
      where: { 
        createdAt: dateFilter,
        active: true
      }
    })
  ])

  const completionRate = totalAppointments > 0 
    ? (completedAppointments / totalAppointments) * 100 
    : 0

  const cancellationRate = totalAppointments > 0 
    ? (cancelledAppointments / totalAppointments) * 100 
    : 0

  return NextResponse.json({
    overview: {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      totalUsers,
      totalStores,
      activeStores
    }
  })
}

async function getAppointmentsReport(dateFilter: any) {
  const appointmentsByStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where: { createdAt: dateFilter },
    _count: { status: true }
  })

  const appointmentsByDay = await prisma.appointment.groupBy({
    by: ['date'],
    where: { createdAt: dateFilter },
    _count: { date: true },
    orderBy: { date: 'asc' }
  })

  const topServices = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: { 
      createdAt: dateFilter,
      status: "COMPLETED"
    },
    _count: { serviceId: true },
    orderBy: { _count: { serviceId: 'desc' } },
    take: 10
  })

  // Buscar nomes dos serviços
  const serviceIds = topServices.map(s => s.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, store: { select: { name: true } } }
  })

  const topServicesWithNames = topServices.map(service => {
    const serviceData = services.find(s => s.id === service.serviceId)
    return {
      ...service,
      serviceName: serviceData?.name || 'Serviço não encontrado',
      storeName: serviceData?.store.name || 'Loja não encontrada'
    }
  })

  return NextResponse.json({
    appointments: {
      byStatus: appointmentsByStatus,
      byDay: appointmentsByDay,
      topServices: topServicesWithNames
    }
  })
}

async function getRevenueReport(dateFilter: any) {
  const revenueByDay = await prisma.appointment.groupBy({
    by: ['date'],
    where: { 
      createdAt: dateFilter,
      status: "COMPLETED"
    },
    _sum: { totalPrice: true },
    orderBy: { date: 'asc' }
  })

  const revenueByStore = await prisma.appointment.groupBy({
    by: ['serviceId'],
    where: { 
      createdAt: dateFilter,
      status: "COMPLETED"
    },
    _sum: { totalPrice: true },
    _count: { serviceId: true },
    orderBy: { _sum: { totalPrice: 'desc' } },
    take: 10
  })

  // Buscar dados das lojas
  const serviceIds = revenueByStore.map(r => r.serviceId)
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { 
      id: true, 
      name: true, 
      store: { 
        select: { 
          id: true, 
          name: true 
        } 
      } 
    }
  })

  const revenueByStoreWithNames = revenueByStore.map(revenue => {
    const serviceData = services.find(s => s.id === revenue.serviceId)
    return {
      ...revenue,
      serviceName: serviceData?.name || 'Serviço não encontrado',
      storeName: serviceData?.store.name || 'Loja não encontrada',
      storeId: serviceData?.store.id
    }
  })

  return NextResponse.json({
    revenue: {
      byDay: revenueByDay,
      byStore: revenueByStoreWithNames,
      total: revenueByStore.reduce((sum, r) => sum + (r._sum.totalPrice || 0), 0)
    }
  })
}

async function getStoresReport(dateFilter: any) {
  const storeStats = await prisma.store.findMany({
    where: { createdAt: dateFilter },
    select: {
      id: true,
      name: true,
      active: true,
      createdAt: true,
      _count: {
        select: {
          services: true,
          appointments: {
            where: { status: "COMPLETED" }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    stores: storeStats
  })
}

async function getUsersReport(dateFilter: any) {
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    where: { createdAt: dateFilter },
    _count: { role: true }
  })

  const usersByDay = await prisma.user.groupBy({
    by: ['createdAt'],
    where: { createdAt: dateFilter },
    _count: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({
    users: {
      byRole: usersByRole,
      byDay: usersByDay
    }
  })
}