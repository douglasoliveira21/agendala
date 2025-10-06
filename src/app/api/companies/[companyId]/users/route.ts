import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
    errorMap: () => ({ message: 'Função deve ser ADMIN, MANAGER ou MEMBER' })
  })
})

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
    errorMap: () => ({ message: 'Função deve ser ADMIN, MANAGER ou MEMBER' })
  })
})

async function checkCompanyAccess(companyId: string, userId: string, requiredRole?: 'OWNER' | 'ADMIN') {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      OR: [
        { ownerId: userId },
        {
          users: {
            some: {
              userId: userId,
              active: true,
              ...(requiredRole && { role: { in: requiredRole === 'OWNER' ? ['OWNER'] : ['OWNER', 'ADMIN'] } })
            }
          }
        }
      ]
    },
    include: {
      users: {
        where: { userId: userId },
        select: { role: true }
      }
    }
  })

  return company
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const company = await checkCompanyAccess(companyId, session.user.id)

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      companyId: companyId,
      ...(search && {
        user: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        }
      })
    }

    const [users, total] = await Promise.all([
      prisma.companyUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              createdAt: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.companyUser.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar usuários da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const company = await checkCompanyAccess(companyId, session.user.id, 'ADMIN')

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada ou sem permissão' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = addUserSchema.parse(body)

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário já está na empresa
    const existingUser = await prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: companyId,
          userId: user.id
        }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já está na empresa' },
        { status: 400 }
      )
    }

    // Verificar limite de usuários da empresa
    const currentUsers = await prisma.companyUser.count({
      where: {
        companyId: companyId,
        active: true
      }
    })

    const companyData = await prisma.company.findUnique({
      where: { id: companyId },
      select: { maxUsers: true }
    })

    if (currentUsers >= (companyData?.maxUsers || 5)) {
      return NextResponse.json(
        { error: 'Limite de usuários da empresa atingido' },
        { status: 400 }
      )
    }

    const companyUser = await prisma.companyUser.create({
      data: {
        companyId: companyId,
        userId: user.id,
        role: validatedData.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(companyUser, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao adicionar usuário à empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}