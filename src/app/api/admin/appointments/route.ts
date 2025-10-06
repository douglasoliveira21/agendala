import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateAppointmentSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  notes: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
})

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
    const status = searchParams.get("status")
    const storeId = searchParams.get("storeId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (storeId) {
      where.service = {
        storeId: storeId
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        select: {
          id: true,
          date: true,
          status: true,
          clientName: true,
          clientEmail: true,
          clientPhone: true,
          notes: true,
          totalPrice: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              store: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          date: "desc"
        },
        skip,
        take: limit
      }),
      prisma.appointment.count({ where })
    ])

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "ID do agendamento é obrigatório" },
        { status: 400 }
      )
    }

    const validatedData = updateAppointmentSchema.parse(updateData)

    // Verificar se o agendamento existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar agendamento
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: validatedData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            store: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}