import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await prisma.store.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        storeId: store.id
      },
      select: {
        id: true,
        date: true,
        startTime: true,
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
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true
          }
        }
      },
      orderBy: [
        {
          date: "desc"
        },
        {
          startTime: "desc"
        }
      ]
    })

    return NextResponse.json({ appointments })

  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}