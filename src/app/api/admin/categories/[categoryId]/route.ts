import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sanitizeName, sanitizeHtml } from "@/lib/validation"

const updateCategorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  active: z.boolean().optional()
})

// GET /api/admin/categories/[categoryId] - Obter categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            stores: true
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

// PUT /api/admin/categories/[categoryId] - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      )
    }

    const validatedData = updateCategorySchema.parse(body)

    // Se o nome está sendo alterado, verificar se não existe outra categoria com o mesmo nome
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive'
          },
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

    // Gerar novo slug se o nome foi alterado
    let updateData: any = {
      ...validatedData,
      description: validatedData.description ? sanitizeHtml(validatedData.description) : validatedData.description
    }

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      let slug = sanitizeName(validatedData.name)
      let counter = 1
      while (await prisma.category.findFirst({ 
        where: { 
          slug,
          id: { not: categoryId }
        } 
      })) {
        slug = `${sanitizeName(validatedData.name)}-${counter}`
        counter++
      }
      updateData.slug = slug
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            stores: true
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

// DELETE /api/admin/categories/[categoryId] - Deletar categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Verificar se a categoria existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            stores: true
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

    // Verificar se a categoria tem lojas associadas
    if (existingCategory._count.stores > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir uma categoria que possui lojas associadas" },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
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