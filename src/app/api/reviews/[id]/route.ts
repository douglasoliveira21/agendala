import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
})

// PUT /api/reviews/[id] - Atualizar avaliação
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating, comment } = updateReviewSchema.parse(body)

    // Verificar se a avaliação existe e pertence ao usuário
    const existingReview = await prisma.review.findUnique({
      where: { id },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar esta avaliação' },
        { status: 403 }
      )
    }

    // Atualizar a avaliação
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Deletar avaliação
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se a avaliação existe e pertence ao usuário
    const existingReview = await prisma.review.findUnique({
      where: { id },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar esta avaliação' },
        { status: 403 }
      )
    }

    // Deletar a avaliação
    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Avaliação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}