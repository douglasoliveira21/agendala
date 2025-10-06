import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { format } from 'date-fns'

const execAsync = promisify(exec)

const createBackupSchema = z.object({
  type: z.enum(['full', 'data_only', 'schema_only']),
  description: z.string().optional(),
  includeFiles: z.boolean().default(false),
  companyId: z.string().optional(),
  storeId: z.string().optional(),
})

const listBackupsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(['full', 'data_only', 'schema_only']).optional(),
  companyId: z.string().optional(),
  storeId: z.string().optional(),
})

interface BackupRecord {
  id: string
  type: 'full' | 'data_only' | 'schema_only'
  description?: string
  filePath: string
  fileSize: number
  includeFiles: boolean
  companyId?: string
  storeId?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error?: string
  createdAt: Date
  completedAt?: Date
  createdBy: string
  company?: {
    id: string
    name: string
  }
  store?: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

// GET /api/backups - Listar backups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const { page, limit, type, companyId, storeId } = listBackupsSchema.parse(params)

    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (session.user.role === 'STORE_OWNER') {
      // Store owners só podem ver backups de suas empresas/lojas
      const userCompanies = await prisma.companyUser.findMany({
        where: {
          userId: session.user.id,
          active: true,
        },
        select: { companyId: true },
      })

      const companyIds = userCompanies.map(uc => uc.companyId)
      
      if (companyIds.length === 0) {
        return NextResponse.json({
          backups: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }

      where.OR = [
        { companyId: { in: companyIds } },
        { createdBy: session.user.id },
      ]
    }

    if (type) {
      where.type = type
    }

    if (companyId) {
      where.companyId = companyId
    }

    if (storeId) {
      where.storeId = storeId
    }

    const [backups, total] = await Promise.all([
      prisma.backup.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.backup.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      backups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Erro ao listar backups:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/backups - Criar backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { type, description, includeFiles, companyId, storeId } = createBackupSchema.parse(body)

    // Verificar se o usuário tem acesso à empresa/loja especificada
    if (session.user.role === 'STORE_OWNER') {
      if (companyId) {
        const companyAccess = await prisma.companyUser.findFirst({
          where: {
            userId: session.user.id,
            companyId,
            active: true,
          },
        })

        if (!companyAccess) {
          return NextResponse.json({ error: 'Acesso negado à empresa' }, { status: 403 })
        }
      }

      if (storeId) {
        const store = await prisma.store.findFirst({
          where: {
            id: storeId,
            company: {
              users: {
                some: {
                  userId: session.user.id,
                  active: true,
                },
              },
            },
          },
        })

        if (!store) {
          return NextResponse.json({ error: 'Acesso negado à loja' }, { status: 403 })
        }
      }
    }

    // Verificar se não há backup em andamento
    const activeBackup = await prisma.backup.findFirst({
      where: {
        status: { in: ['pending', 'in_progress'] },
        ...(companyId && { companyId }),
        ...(storeId && { storeId }),
      },
    })

    if (activeBackup) {
      return NextResponse.json({ error: 'Já existe um backup em andamento' }, { status: 409 })
    }

    // Criar registro do backup
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
    const fileName = `backup_${type}_${timestamp}.sql`
    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, fileName)

    // Garantir que o diretório existe
    try {
      await fs.mkdir(backupDir, { recursive: true })
    } catch (error) {
      // Diretório já existe
    }

    const backup = await prisma.backup.create({
      data: {
        type,
        description,
        filePath,
        fileSize: 0,
        includeFiles,
        companyId,
        storeId,
        status: 'pending',
        createdBy: session.user.id,
      },
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

    // Iniciar processo de backup em background
    processBackup(backup.id, type, filePath, includeFiles, companyId, storeId)

    return NextResponse.json(backup, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar backup:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para processar backup em background
async function processBackup(
  backupId: string,
  type: 'full' | 'data_only' | 'schema_only',
  filePath: string,
  includeFiles: boolean,
  companyId?: string,
  storeId?: string
) {
  try {
    // Atualizar status para in_progress
    await prisma.backup.update({
      where: { id: backupId },
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

    let pgDumpCommand = `pg_dump`
    
    // Configurar opções baseadas no tipo
    switch (type) {
      case 'schema_only':
        pgDumpCommand += ' --schema-only'
        break
      case 'data_only':
        pgDumpCommand += ' --data-only'
        break
      case 'full':
        // Backup completo (padrão)
        break
    }

    // Adicionar filtros por empresa/loja se especificado
    if (companyId || storeId) {
      // Para backups específicos, incluir apenas tabelas relevantes
      const tables = [
        'User', 'Account', 'Session', 'VerificationToken',
        'Company', 'CompanyUser', 'Store', 'Category', 'Service',
        'Appointment', 'Review', 'Coupon', 'CouponUsage',
        'Notification', 'WhatsAppSession', 'WhatsAppMessage'
      ]

      for (const table of tables) {
        pgDumpCommand += ` --table=${table}`
      }
    }

    // Configurar conexão
    pgDumpCommand += ` --host=${host} --port=${port} --username=${username} --dbname=${dbName} --file="${filePath}"`

    // Configurar variável de ambiente para senha
    const env = { ...process.env, PGPASSWORD: password }

    // Executar backup
    await execAsync(pgDumpCommand, { env })

    // Verificar tamanho do arquivo
    const stats = await fs.stat(filePath)
    const fileSize = stats.size

    // Se incluir arquivos, criar arquivo ZIP
    let finalPath = filePath
    let finalSize = fileSize

    if (includeFiles) {
      const zipPath = filePath.replace('.sql', '.zip')
      const uploadsDir = path.join(process.cwd(), 'uploads')
      
      // Criar ZIP com SQL + arquivos
      const zipCommand = `7z a "${zipPath}" "${filePath}" "${uploadsDir}"`
      
      try {
        await execAsync(zipCommand)
        const zipStats = await fs.stat(zipPath)
        finalPath = zipPath
        finalSize = zipStats.size
        
        // Remover arquivo SQL original
        await fs.unlink(filePath)
      } catch (zipError) {
        console.warn('Erro ao criar ZIP, mantendo apenas SQL:', zipError)
      }
    }

    // Atualizar registro com sucesso
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: 'completed',
        filePath: finalPath,
        fileSize: finalSize,
        completedAt: new Date(),
      },
    })

  } catch (error) {
    console.error('Erro no processo de backup:', error)
    
    // Atualizar registro com erro
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
    })
  }
}