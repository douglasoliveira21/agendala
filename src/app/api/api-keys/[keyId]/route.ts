import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateApiKeySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  permissions: z.record(z.any()).optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  rateLimit: z.number().min(1).max(10000).optional()
})

// GET /api/api-keys/[keyId] - Obter API Key específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        createdById: session.user.id
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        active: true,
        lastUsedAt: true,
        expiresAt: true,
        rateLimit: true,
        companyId: true,
        storeId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            usageLogs: true
          }
        }
      }
    })

    if (!apiKey) {
      return Response.json({ error: 'API Key não encontrada' }, { status: 404 })
    }

    return Response.json({ apiKey })
  } catch (error) {
    console.error('Erro ao obter API Key:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/api-keys/[keyId] - Atualizar API Key
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateApiKeySchema.parse(body)

    // Verificar se a API Key existe e pertence ao usuário
    const existingApiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        createdById: session.user.id
      }
    })

    if (!existingApiKey) {
      return Response.json({ error: 'API Key não encontrada' }, { status: 404 })
    }

    const updateData: any = {}

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    if (validatedData.permissions !== undefined) {
      updateData.permissions = validatedData.permissions
    }

    if (validatedData.active !== undefined) {
      updateData.active = validatedData.active
    }

    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null
    }

    if (validatedData.rateLimit !== undefined) {
      updateData.rateLimit = validatedData.rateLimit
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        active: true,
        lastUsedAt: true,
        expiresAt: true,
        rateLimit: true,
        companyId: true,
        storeId: true,
        company: {
          select: {
            id: true,
            name: true
          }
        },
        store: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    return Response.json({ apiKey })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    console.error('Erro ao atualizar API Key:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/api-keys/[keyId] - Deletar API Key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a API Key existe e pertence ao usuário
    const existingApiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        createdById: session.user.id
      }
    })

    if (!existingApiKey) {
      return Response.json({ error: 'API Key não encontrada' }, { status: 404 })
    }

    await prisma.apiKey.delete({
      where: { id: keyId }
    })

    return Response.json({ message: 'API Key deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar API Key:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}