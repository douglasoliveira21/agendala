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
      where: { ownerId: session.user.id }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Buscar clientes que fizeram agendamentos na loja
    const customers = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        appointments: {
          some: {
            storeId: store.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        birthDate: true,
        notes: true,
        createdAt: true,
        _count: {
          select: {
            appointments: {
              where: {
                storeId: store.id
              }
            }
          }
        },
        appointments: {
          where: {
            storeId: store.id
          },
          select: {
            id: true,
            date: true,
            status: true,
            service: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      customers
    })

  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}