import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
    errorMap: () => ({ message: 'Função deve ser ADMIN, MANAGER ou MEMBER' })
  }),
  active: z.boolean().optional()
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const company = await checkCompanyAccess(params.companyId, session.user.id, 'ADMIN')

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada ou sem permissão' }, { status: 404 })
    }

    // Verificar se o usuário existe na empresa
    const companyUser = await prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: params.companyId,
          userId: params.userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!companyUser) {
      return NextResponse.json({ error: 'Usuário não encontrado na empresa' }, { status: 404 })
    }

    // Verificar se está tentando alterar o owner
    const companyData = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: { ownerId: true }
    })

    if (companyData?.ownerId === params.userId) {
      return NextResponse.json(
        { error: 'Não é possível alterar a função do proprietário da empresa' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserRoleSchema.parse(body)

    const updatedUser = await prisma.companyUser.update({
      where: {
        companyId_userId: {
          companyId: params.companyId,
          userId: params.userId
        }
      },
      data: validatedData,
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar usuário da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const company = await checkCompanyAccess(params.companyId, session.user.id, 'ADMIN')

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada ou sem permissão' }, { status: 404 })
    }

    // Verificar se o usuário existe na empresa
    const companyUser = await prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: params.companyId,
          userId: params.userId
        }
      }
    })

    if (!companyUser) {
      return NextResponse.json({ error: 'Usuário não encontrado na empresa' }, { status: 404 })
    }

    // Verificar se está tentando remover o owner
    const companyData = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: { ownerId: true }
    })

    if (companyData?.ownerId === params.userId) {
      return NextResponse.json(
        { error: 'Não é possível remover o proprietário da empresa' },
        { status: 400 }
      )
    }

    // Verificar se o usuário está tentando se remover
    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: 'Não é possível se remover da empresa' },
        { status: 400 }
      )
    }

    await prisma.companyUser.delete({
      where: {
        companyId_userId: {
          companyId: params.companyId,
          userId: params.userId
        }
      }
    })

    return NextResponse.json({ message: 'Usuário removido da empresa com sucesso' })
  } catch (error) {
    console.error('Erro ao remover usuário da empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}