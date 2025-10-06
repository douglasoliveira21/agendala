import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateStoreSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  categoryId: z.string().optional(),
  ownerId: z.string().optional(),
  active: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const stores = await prisma.store.findMany({
      include: {
        category: {
          select: {
            name: true
          }
        },
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            services: true,
            appointments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ stores })

  } catch (error) {
    console.error("Erro ao buscar lojas:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/stores - Atualizar loja
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateStoreSchema.parse(body)

    // Verificar se a loja existe
    const existingStore = await prisma.store.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingStore) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe (se estiver sendo alterada)
    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!categoryExists) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 400 }
        )
      }
    }

    // Verificar se o proprietário existe (se estiver sendo alterado)
    if (validatedData.ownerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { 
          id: validatedData.ownerId,
          role: "STORE_OWNER"
        }
      })

      if (!ownerExists) {
        return NextResponse.json(
          { error: "Proprietário não encontrado ou não é um lojista" },
          { status: 400 }
        )
      }
    }

    // Atualizar loja
    const updatedStore = await prisma.store.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.address !== undefined && { address: validatedData.address }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.ownerId && { ownerId: validatedData.ownerId }),
        ...(validatedData.active !== undefined && { active: validatedData.active })
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            services: true,
            appointments: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Loja atualizada com sucesso",
      store: updatedStore 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar loja:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}