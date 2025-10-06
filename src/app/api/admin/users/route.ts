import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "STORE_OWNER", "ADMIN"]).optional(),
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            stores: true,
            appointments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users - Atualizar usuário
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
    const validatedData = updateUserSchema.parse(body)

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Não permitir que o admin altere seu próprio role
    if (existingUser.id === session.user.id && validatedData.role && validatedData.role !== existingUser.role) {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio papel" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe (se estiver sendo alterado)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        )
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.role && { role: validatedData.role }),
        ...(validatedData.active !== undefined && { active: validatedData.active })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            stores: true,
            appointments: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Usuário atualizado com sucesso",
      user: updatedUser 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}