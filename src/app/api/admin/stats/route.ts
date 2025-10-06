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

    // Buscar estatísticas
    const [totalUsers, totalStores, activeStores, totalAppointments] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.store.count({ where: { active: true } }),
      prisma.appointment.count()
    ])

    return NextResponse.json({
      totalUsers,
      totalStores,
      activeStores,
      totalAppointments
    })

  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}