import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

const updateBackupSchema = z.object({
  description: z.string().optional(),
})

// GET /api/backups/[backupId] - Obter backup específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { backupId } = await params

    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso ao backup
    if (session.user.role === 'STORE_OWNER') {
      if (backup.companyId) {
        const companyAccess = await prisma.companyUser.findFirst({
          where: {
            userId: session.user.id,
            companyId: backup.companyId,
            active: true,
          },
        })

        if (!companyAccess && backup.createdBy !== session.user.id) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }
      } else if (backup.createdBy !== session.user.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    return NextResponse.json(backup)
  } catch (error) {
    console.error('Erro ao obter backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/backups/[backupId] - Atualizar backup
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { backupId } = await params

    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { description } = updateBackupSchema.parse(body)

    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso ao backup
    if (session.user.role === 'STORE_OWNER') {
      if (backup.companyId) {
        const companyAccess = await prisma.companyUser.findFirst({
          where: {
            userId: session.user.id,
            companyId: backup.companyId,
            active: true,
          },
        })

        if (!companyAccess && backup.createdBy !== session.user.id) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }
      } else if (backup.createdBy !== session.user.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    const updatedBackup = await prisma.backup.update({
      where: { id: backupId },
      data: { description },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedBackup)
  } catch (error) {
    console.error('Erro ao atualizar backup:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/backups/[backupId] - Excluir backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { backupId } = await params

    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id: backupId },
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso ao backup
    if (session.user.role === 'STORE_OWNER') {
      if (backup.companyId) {
        const companyAccess = await prisma.companyUser.findFirst({
          where: {
            userId: session.user.id,
            companyId: backup.companyId,
            active: true,
          },
        })

        if (!companyAccess && backup.createdBy !== session.user.id) {
          return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }
      } else if (backup.createdBy !== session.user.id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Não permitir exclusão de backup em andamento
    if (backup.status === 'in_progress') {
      return NextResponse.json({ error: 'Não é possível excluir backup em andamento' }, { status: 409 })
    }

    // Excluir arquivo físico se existir
    if (backup.filePath) {
      try {
        await fs.unlink(backup.filePath)
      } catch (fileError) {
        console.warn('Erro ao excluir arquivo de backup:', fileError)
        // Continuar mesmo se não conseguir excluir o arquivo
      }
    }

    // Excluir registro do banco
    await prisma.backup.delete({
      where: { id: backupId },
    })

    return NextResponse.json({ message: 'Backup excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}