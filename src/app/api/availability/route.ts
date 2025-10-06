import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { addMinutes, format, parseISO, isSameDay } from "date-fns"

const availabilitySchema = z.object({
  storeId: z.string().min(1, "ID da loja é obrigatório"),
  serviceId: z.string().min(1, "ID do serviço é obrigatório"),
  date: z.string().min(1, "Data é obrigatória")
})

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      storeId: searchParams.get("storeId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date")
    }

    // Validar parâmetros
    const validatedParams = availabilitySchema.parse(params)
    const targetDate = parseISO(validatedParams.date)

    // Buscar loja com horários de funcionamento
    const store = await prisma.store.findUnique({
      where: { id: validatedParams.storeId },
      select: {
        id: true,
        name: true,
        workingHours: true,
        active: true
      }
    })

    if (!store || !store.active) {
      return NextResponse.json(
        { error: "Loja não encontrada ou inativa" },
        { status: 404 }
      )
    }

    // Buscar serviço
    const service = await prisma.service.findUnique({
      where: { id: validatedParams.serviceId },
      select: {
        id: true,
        name: true,
        duration: true,
        active: true,
        storeId: true
      }
    })

    if (!service || !service.active || service.storeId !== validatedParams.storeId) {
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo" },
        { status: 404 }
      )
    }

    // Verificar se a loja funciona no dia da semana
    const dayOfWeek = targetDate.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    const workingDay = store.workingHours?.[dayName]
    if (!workingDay?.active) {
      return NextResponse.json({
        success: true,
        data: {
          date: validatedParams.date,
          timeSlots: [],
          message: "Loja fechada neste dia"
        }
      })
    }

    // Buscar agendamentos existentes para a data
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        storeId: validatedParams.storeId,
        date: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        id: true,
        startTime: true,
        service: {
          select: {
            duration: true
          }
        }
      }
    })

    // Gerar slots de horário
    const timeSlots: TimeSlot[] = []
    const startTime = workingDay.start
    const endTime = workingDay.end
    const serviceDuration = service.duration

    let currentTime = new Date(`2000-01-01T${startTime}:00`)
    const endDateTime = new Date(`2000-01-01T${endTime}:00`)

    while (currentTime < endDateTime) {
      const timeString = currentTime.toTimeString().slice(0, 5)
      
      // Verificar se há conflito com agendamentos existentes
      const hasConflict = existingAppointments.some(appointment => {
        if (!appointment.startTime) return false
        
        const appointmentStart = new Date(`2000-01-01T${appointment.startTime}:00`)
        const appointmentEnd = addMinutes(appointmentStart, appointment.service.duration)
        const slotStart = currentTime
        const slotEnd = addMinutes(currentTime, serviceDuration)

        // Verificar sobreposição de horários
        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        )
      })

      // Verificar se o slot completo cabe no horário de funcionamento
      const slotEnd = addMinutes(currentTime, serviceDuration)
      const fitsInWorkingHours = slotEnd <= endDateTime

      timeSlots.push({
        time: timeString,
        available: !hasConflict && fitsInWorkingHours,
        reason: hasConflict 
          ? "Horário já agendado" 
          : !fitsInWorkingHours 
          ? "Horário insuficiente para o serviço" 
          : undefined
      })
      
      // Avançar para o próximo slot (intervalos de 30 minutos)
      currentTime.setMinutes(currentTime.getMinutes() + 30)
    }

    return NextResponse.json({
      success: true,
      data: {
        date: validatedParams.date,
        store: {
          id: store.id,
          name: store.name
        },
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration
        },
        timeSlots,
        workingHours: {
          start: workingDay.start,
          end: workingDay.end
        }
      }
    })

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}