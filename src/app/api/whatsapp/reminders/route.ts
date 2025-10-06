import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { whatsappService } from "@/lib/whatsapp"
import { addDays, format, startOfDay, endOfDay } from "date-fns"

// POST - Enviar lembretes automáticos
export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição tem autorização (pode ser um cron job)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar agendamentos para amanhã que ainda não receberam lembrete
    const tomorrow = addDays(new Date(), 1)
    const startOfTomorrow = startOfDay(tomorrow)
    const endOfTomorrow = endOfDay(tomorrow)

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reminderSent: false
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

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const appointment of appointments) {
      try {
        // Verificar se a loja tem WhatsApp conectado
        if (!appointment.store.whatsappConnected) {
          continue
        }

        // Gerar mensagem de lembrete
        const message = whatsappService.generateReminderMessage(
          appointment.store.name,
          appointment.clientName,
          appointment.service.name,
          format(appointment.date, 'dd/MM/yyyy'),
          appointment.startTime
        )

        // Enviar lembrete
        await whatsappService.sendMessage(
          appointment.store.id,
          appointment.clientPhone,
          message,
          'REMINDER'
        )

        // Marcar como lembrete enviado
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true }
        })

        successCount++

      } catch (error) {
        console.error(`Erro ao enviar lembrete para agendamento ${appointment.id}:`, error)
        errors.push(`Agendamento ${appointment.id}: ${error}`)
        errorCount++
      }
    }

    return NextResponse.json({
      message: "Lembretes processados",
      totalAppointments: appointments.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error("Erro ao processar lembretes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET - Verificar agendamentos que precisam de lembrete (para debug)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug")

    if (debug !== "true") {
      return NextResponse.json(
        { error: "Endpoint apenas para debug" },
        { status: 403 }
      )
    }

    // Buscar agendamentos para amanhã que ainda não receberam lembrete
    const tomorrow = addDays(new Date(), 1)
    const startOfTomorrow = startOfDay(tomorrow)
    const endOfTomorrow = endOfDay(tomorrow)

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        reminderSent: false
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

    return NextResponse.json({
      date: format(tomorrow, 'dd/MM/yyyy'),
      totalAppointments: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        storeName: apt.store.name,
        serviceName: apt.service.name,
        startTime: apt.startTime,
        whatsappConnected: apt.store.whatsappConnected,
        reminderSent: apt.reminderSent
      }))
    })

  } catch (error) {
    console.error("Erro ao verificar lembretes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}