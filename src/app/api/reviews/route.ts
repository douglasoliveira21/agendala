import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createReviewSchema = z.object({
  storeId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// GET /api/reviews - Listar avaliações de uma loja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { storeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { storeId },
      }),
    ])

    // Calcular estatísticas das avaliações
    const stats = await prisma.review.aggregate({
      where: { storeId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { storeId },
      _count: { rating: true },
    })

    const distribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1
      const found = ratingDistribution.find(r => r.rating === rating)
      return {
        rating,
        count: found?._count.rating || 0,
      }
    })

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        average: stats._avg.rating || 0,
        total: stats._count.rating || 0,
        distribution,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storeId, rating, comment } = createReviewSchema.parse(body)

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário já avaliou esta loja
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_storeId: {
          userId: session.user.id,
          storeId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Você já avaliou esta loja' },
        { status: 400 }
      )
    }

    // Criar a avaliação
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        storeId,
        rating,
        comment,
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

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}