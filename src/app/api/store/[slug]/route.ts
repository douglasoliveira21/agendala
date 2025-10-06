import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const store = await prisma.store.findUnique({
      where: {
        slug,
        active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        banner: true,
        coverImage: true,
        logoImage: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        slug: true,
        primaryColor: true,
        secondaryColor: true,
        workingHours: true,
        allowSimpleBooking: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        owner: {
          select: {
            name: true
          }
        },
        services: {
          where: {
            active: true
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            active: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ store })
  } catch (error) {
    console.error('Erro ao buscar loja:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}