import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/appointment/[id] - Obter agendamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: id
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            city: true,
            state: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      appointment
    })

  } catch (error) {
    console.error('Erro ao buscar agendamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}