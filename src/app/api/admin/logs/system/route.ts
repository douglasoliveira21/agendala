import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface SystemEvent {
  id: string
  type: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "ERROR"
  action: string
  resource?: string
  resourceId?: string
  userId?: string
  userName?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  details?: any
  createdAt: string
}

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
    const type = searchParams.get("type")
    const action = searchParams.get("action")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Dados simulados para demonstração
    // Em uma implementação real, estes dados viriam de um sistema de auditoria
    const allEvents: SystemEvent[] = [
      {
        id: "1",
        type: "LOGIN",
        action: "Usuário fez login no sistema",
        userId: "user1",
        userName: "João Silva",
        userEmail: "joao@example.com",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutos atrás
      },
      {
        id: "2",
        type: "CREATE",
        action: "Agendamento criado",
        resource: "appointment",
        resourceId: "apt123",
        userId: "user2",
        userName: "Maria Santos",
        userEmail: "maria@example.com",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
        details: { 
          storeId: "store1", 
          serviceId: "service1",
          date: "2024-01-15",
          time: "14:00"
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutos atrás
      },
      {
        id: "3",
        type: "ERROR",
        action: "Erro de autenticação",
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        details: { 
          error: "Invalid credentials",
          attemptedEmail: "hacker@example.com"
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutos atrás
      },
      {
        id: "4",
        type: "UPDATE",
        action: "Perfil de usuário atualizado",
        resource: "user",
        resourceId: "user3",
        userId: "user3",
        userName: "Carlos Oliveira",
        userEmail: "carlos@example.com",
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        details: {
          changedFields: ["phone", "address"]
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutos atrás
      },
      {
        id: "5",
        type: "DELETE",
        action: "Agendamento cancelado",
        resource: "appointment",
        resourceId: "apt124",
        userId: "user4",
        userName: "Ana Costa",
        userEmail: "ana@example.com",
        ipAddress: "192.168.1.104",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: {
          reason: "Cliente solicitou cancelamento",
          originalDate: "2024-01-16",
          originalTime: "10:00"
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
      },
      {
        id: "6",
        type: "LOGIN",
        action: "Administrador fez login",
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        ipAddress: "192.168.1.105",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() // 1.5 horas atrás
      },
      {
        id: "7",
        type: "CREATE",
        action: "Nova categoria criada",
        resource: "category",
        resourceId: "cat123",
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        ipAddress: "192.168.1.105",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: {
          categoryName: "Beleza e Estética",
          slug: "beleza-estetica"
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 horas atrás
      },
      {
        id: "8",
        type: "ERROR",
        action: "Falha no envio de WhatsApp",
        resource: "whatsapp_message",
        resourceId: "msg123",
        details: {
          error: "Connection timeout",
          phone: "+5511999999999",
          messageType: "appointment_reminder"
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 horas atrás
      }
    ]

    // Aplicar filtros
    let filteredEvents = allEvents

    if (type && type !== "all") {
      filteredEvents = filteredEvents.filter(event => event.type === type)
    }

    if (action) {
      filteredEvents = filteredEvents.filter(event => 
        event.action.toLowerCase().includes(action.toLowerCase())
      )
    }

    if (userId && userId !== "all") {
      filteredEvents = filteredEvents.filter(event => event.userId === userId)
    }

    if (startDate) {
      const start = new Date(startDate)
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.createdAt) >= start
      )
    }

    if (endDate) {
      const end = new Date(endDate)
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.createdAt) <= end
      )
    }

    // Aplicar paginação
    const total = filteredEvents.length
    const skip = (page - 1) * limit
    const paginatedEvents = filteredEvents.slice(skip, skip + limit)

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      events: paginatedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      },
      stats: {
        totalEvents: total,
        eventTypes: filteredEvents.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error) {
    console.error("Erro ao buscar eventos do sistema:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}