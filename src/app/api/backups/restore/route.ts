import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const restoreBackupSchema = z.object({
  backupId: z.string().optional(),
  filePath: z.string().optional(),
  confirmRestore: z.boolean(),
  dropExisting: z.boolean().default(false),
  restoreData: z.boolean().default(true),
  restoreSchema: z.boolean().default(true),
})

// POST /api/backups/restore - Restaurar backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas ADMIN pode restaurar backups
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores podem restaurar backups' }, { status: 403 })
    }

    const body = await request.json()
    const { backupId, filePath, confirmRestore, dropExisting, restoreData, restoreSchema } = restoreBackupSchema.parse(body)

    if (!confirmRestore) {
      return NextResponse.json({ error: 'Confirmação de restauração é obrigatória' }, { status: 400 })
    }

    let backupFilePath: string
    let backup: any = null

    if (backupId) {
      // Restaurar de backup existente
      backup = await prisma.backup.findUnique({
        where: { id: backupId },
      })

      if (!backup) {
        return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
      }

      if (backup.status !== 'completed') {
        return NextResponse.json({ error: 'Backup não está disponível para restauração' }, { status: 409 })
      }

      backupFilePath = backup.filePath
    } else if (filePath) {
      // Restaurar de arquivo específico
      backupFilePath = filePath
    } else {
      return NextResponse.json({ error: 'backupId ou filePath é obrigatório' }, { status: 400 })
    }

    // Verificar se o arquivo existe
    try {
      await fs.access(backupFilePath)
    } catch {
      return NextResponse.json({ error: 'Arquivo de backup não encontrado' }, { status: 404 })
    }

    // Criar registro de restauração
    const restore = await prisma.backupRestore.create({
      data: {
        backupId: backup?.id,
        filePath: backupFilePath,
        dropExisting,
        restoreData,
        restoreSchema,
        status: 'pending',
        createdBy: session.user.id,
      },
    })

    // Iniciar processo de restauração em background
    processRestore(restore.id, backupFilePath, dropExisting, restoreData, restoreSchema)

    return NextResponse.json(restore, { status: 201 })
  } catch (error) {
    console.error('Erro ao iniciar restauração:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET /api/backups/restore - Listar restaurações
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas ADMIN pode ver restaurações
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [restores, total] = await Promise.all([
      prisma.backupRestore.findMany({
        include: {
          backup: {
            select: {
              id: true,
              type: true,
              description: true,
              createdAt: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.backupRestore.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      restores,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Erro ao listar restaurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para processar restauração em background
async function processRestore(
  restoreId: string,
  filePath: string,
  dropExisting: boolean,
  restoreData: boolean,
  restoreSchema: boolean
) {
  try {
    // Atualizar status para in_progress
    await prisma.backupRestore.update({
      where: { id: restoreId },
      data: { status: 'in_progress' },
    })

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada')
    }

    // Extrair informações da URL do banco
    const url = new URL(databaseUrl)
    const dbName = url.pathname.slice(1)
    const host = url.hostname
    const port = url.port || '5432'
    const username = url.username
    const password = url.password

    // Se for arquivo ZIP, extrair primeiro
    let sqlFilePath = filePath
    if (filePath.endsWith('.zip')) {
      const extractDir = path.dirname(filePath)
      const extractCommand = `7z x "${filePath}" -o"${extractDir}" -y`
      
      await execAsync(extractCommand)
      
      // Encontrar arquivo SQL extraído
      const files = await fs.readdir(extractDir)
      const sqlFile = files.find(f => f.endsWith('.sql'))
      
      if (!sqlFile) {
        throw new Error('Arquivo SQL não encontrado no ZIP')
      }
      
      sqlFilePath = path.join(extractDir, sqlFile)
    }

    // Preparar comando de restauração
    let psqlCommand = `psql`

    // Configurar opções baseadas nas preferências
    if (dropExisting) {
      // Criar script para limpar banco antes da restauração
      const cleanScript = `
        DO $$ DECLARE
          r RECORD;
        BEGIN
          -- Desabilitar triggers
          SET session_replication_role = replica;
          
          -- Limpar dados das tabelas
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
          
          -- Reabilitar triggers
          SET session_replication_role = DEFAULT;
        END $$;
      `
      
      const cleanFilePath = path.join(path.dirname(sqlFilePath), 'clean.sql')
      await fs.writeFile(cleanFilePath, cleanScript)
      
      // Executar limpeza
      const cleanCommand = `psql --host=${host} --port=${port} --username=${username} --dbname=${dbName} --file="${cleanFilePath}"`
      const cleanEnv = { ...process.env, PGPASSWORD: password }
      await execAsync(cleanCommand, { env: cleanEnv })
      
      // Remover arquivo de limpeza
      await fs.unlink(cleanFilePath)
    }

    // Configurar comando de restauração
    if (!restoreSchema && restoreData) {
      psqlCommand += ' --data-only'
    } else if (restoreSchema && !restoreData) {
      psqlCommand += ' --schema-only'
    }

    psqlCommand += ` --host=${host} --port=${port} --username=${username} --dbname=${dbName} --file="${sqlFilePath}"`

    // Configurar variável de ambiente para senha
    const env = { ...process.env, PGPASSWORD: password }

    // Executar restauração
    await execAsync(psqlCommand, { env })

    // Limpar arquivo SQL extraído se foi de um ZIP
    if (filePath.endsWith('.zip') && sqlFilePath !== filePath) {
      await fs.unlink(sqlFilePath)
    }

    // Atualizar registro com sucesso
    await prisma.backupRestore.update({
      where: { id: restoreId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

  } catch (error) {
    console.error('Erro no processo de restauração:', error)
    
    // Atualizar registro com erro
    await prisma.backupRestore.update({
      where: { id: restoreId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
    })
  }
}