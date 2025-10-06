import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// GET /api/backups/[backupId]/download - Download do backup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  const { backupId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

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
      },
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    // Verificar se o backup foi concluído
    if (backup.status !== 'completed') {
      return NextResponse.json({ error: 'Backup não está disponível para download' }, { status: 409 })
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

    // Verificar se o arquivo existe
    if (!backup.filePath) {
      return NextResponse.json({ error: 'Arquivo de backup não encontrado' }, { status: 404 })
    }

    try {
      await fs.access(backup.filePath)
    } catch {
      return NextResponse.json({ error: 'Arquivo de backup não existe' }, { status: 404 })
    }

    // Ler o arquivo
    const fileBuffer = await fs.readFile(backup.filePath)
    const fileName = path.basename(backup.filePath)

    // Determinar o tipo de conteúdo
    const contentType = backup.filePath.endsWith('.zip') 
      ? 'application/zip' 
      : 'application/sql'

    // Retornar o arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Erro ao fazer download do backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}