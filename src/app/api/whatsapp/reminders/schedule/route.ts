import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { whatsappService } from "@/lib/whatsapp-service"
import { addDays, format, parseISO, isBefore, addHours } from "date-fns"

// POST - Agendar lembretes para agendamentos do dia seguinte
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (apenas CRON ou ADMIN)
    const cronSecret = request.headers.get('x-cron-secret')
    
    if (cronSecret !== process.env.CRON_SECRET) {
      const session = await getServerSession(authOptions)
      if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Não autorizado" },
          { status: 401 }
        )
      }
    }

    const tomorrow = addDays(new Date(), 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = addHours(tomorrowStart, 24)

    // Buscar agendamentos para amanhã que ainda não receberam lembrete
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: tomorrowStart,
          lt: tomorrowEnd
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reminderSent: false,
        store: {
          whatsappConnected: true
        }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            whatsappConnected: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    })

    let sentCount = 0
    let errorCount = 0

    // Enviar lembretes
    for (const appointment of appointments) {
      try {
        // Verificar se a sessão do WhatsApp está conectada
        const isConnected = await whatsappService.isSessionConnected(appointment.store.id)
        
        if (!isConnected) {
          console.log(`WhatsApp não conectado para loja ${appointment.store.name}`)
          continue
        }

        // Gerar mensagem de lembrete
        const reminderMessage = whatsappService.generateReminderMessage(
          appointment.store.name,
          appointment.clientName,
          appointment.service.name,
          format(appointment.date, 'dd/MM/yyyy'),
          appointment.startTime
        )

        // Enviar lembrete
        const sent = await whatsappService.sendMessage(
          appointment.store.id,
          appointment.clientPhone,
          reminderMessage,
          'REMINDER'
        )

        if (sent) {
          // Marcar como lembrete enviado
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent: true }
          })
          
          sentCount++
          console.log(`Lembrete enviado para ${appointment.clientName} - ${appointment.store.name}`)
        } else {
          errorCount++
          console.error(`Falha ao enviar lembrete para ${appointment.clientName}`)
        }

      } catch (error) {
        errorCount++
        console.error(`Erro ao processar lembrete para agendamento ${appointment.id}:`, error)
      }
    }

    return NextResponse.json({
      message: "Processamento de lembretes concluído",
      totalAppointments: appointments.length,
      sentCount,
      errorCount
    })

  } catch (error) {
    console.error("Erro ao processar lembretes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET - Verificar agendamentos que precisam de lembrete
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STORE_OWNER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    const tomorrow = addDays(new Date(), 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = addHours(tomorrowStart, 24)

    let where: any = {
      date: {
        gte: tomorrowStart,
        lt: tomorrowEnd
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }

    // Filtrar por loja se especificado
    if (storeId) {
      where.storeId = storeId
    }

    // Se for lojista, filtrar apenas suas lojas
    if (session.user.role === 'STORE_OWNER') {
      where.store = { ownerId: session.user.id }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            whatsappConnected: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    const pendingReminders = appointments.filter(apt => !apt.reminderSent)
    const sentReminders = appointments.filter(apt => apt.reminderSent)

    return NextResponse.json({
      totalAppointments: appointments.length,
      pendingReminders: pendingReminders.length,
      sentReminders: sentReminders.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        serviceName: apt.service.name,
        storeName: apt.store.name,
        date: format(apt.date, 'dd/MM/yyyy'),
        time: apt.startTime,
        reminderSent: apt.reminderSent,
        whatsappConnected: apt.store.whatsappConnected
      }))
    })

  } catch (error) {
    console.error("Erro ao buscar agendamentos para lembrete:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}