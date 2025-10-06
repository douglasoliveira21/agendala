import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  description: z.string().optional(),
  color: z.string().optional()
})

// GET /api/dashboard/categories/[categoryId] - Obter categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await prisma.store.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe e pertence à loja
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id: categoryId,
        storeId: store.id
      },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })

  } catch (error) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard/categories/[categoryId] - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await prisma.store.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe e pertence à loja
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id: categoryId,
        storeId: store.id
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)

    // Se o nome está sendo alterado, verificar se não existe outra categoria com o mesmo nome
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.serviceCategory.findFirst({
        where: {
          name: validatedData.name,
          storeId: store.id,
          id: { not: categoryId }
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: "Já existe uma categoria com este nome" },
          { status: 400 }
        )
      }
    }

    const category = await prisma.serviceCategory.update({
      where: {
        id: categoryId
      },
      data: validatedData,
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    return NextResponse.json({ category })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard/categories/[categoryId] - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar a loja do usuário
    const store = await prisma.store.findFirst({
      where: {
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe e pertence à loja
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id: categoryId,
        storeId: store.id
      },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se a categoria tem serviços associados
    if (existingCategory._count.services > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma categoria que possui serviços associados" },
        { status: 400 }
      )
    }

    await prisma.serviceCategory.delete({
      where: {
        id: categoryId
      }
    })

    return NextResponse.json({ message: "Categoria excluída com sucesso" })

  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}