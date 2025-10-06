import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  maxStores: z.number().int().min(1).optional(),
  maxUsers: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
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

    const fullCompany = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
            createdAt: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        subscription: {
          include: {
            plan: true
          }
        },
        _count: {
          select: {
            stores: true,
            users: true
          }
        }
      }
    })

    return NextResponse.json(fullCompany)
  } catch (error) {
    console.error('Erro ao buscar empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validatedData = updateCompanySchema.parse(body)

    // Verificar se o slug já existe (se estiver sendo alterado)
    if (validatedData.slug && validatedData.slug !== company.slug) {
      const existingCompany = await prisma.company.findUnique({
        where: { slug: validatedData.slug }
      })

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Slug já está em uso' },
          { status: 400 }
        )
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
            createdAt: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        subscription: {
          include: {
            plan: true
          }
        },
        _count: {
          select: {
            stores: true,
            users: true
          }
        }
      }
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const company = await checkCompanyAccess(companyId, session.user.id, 'OWNER')

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada ou sem permissão' }, { status: 404 })
    }

    // Verificar se a empresa tem lojas ativas
    const activeStores = await prisma.store.count({
      where: {
        companyId: companyId,
        active: true
      }
    })

    if (activeStores > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir empresa com lojas ativas' },
        { status: 400 }
      )
    }

    // Verificar se há agendamentos futuros
    const futureAppointments = await prisma.appointment.count({
      where: {
        store: {
          companyId: companyId
        },
        date: {
          gte: new Date()
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    })

    if (futureAppointments > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir empresa com agendamentos futuros' },
        { status: 400 }
      )
    }

    await prisma.company.delete({
      where: { id: companyId }
    })

    return NextResponse.json({ message: 'Empresa excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}