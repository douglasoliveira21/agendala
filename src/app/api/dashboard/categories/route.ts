import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional()
})

const updateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  description: z.string().optional(),
  color: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
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

    const categories = await prisma.serviceCategory.findMany({
      where: {
        storeId: store.id
      },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: validatedData.name,
        storeId: store.id
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 }
      )
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || "#3B82F6",
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

    return NextResponse.json({ category }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}