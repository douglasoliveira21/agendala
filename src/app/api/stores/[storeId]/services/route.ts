import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createServiceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0, "Preço deve ser maior que zero"),
  duration: z.number().min(15, "Duração mínima de 15 minutos")
})

// GET - Listar serviços da loja
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  try {
    const services = await prisma.service.findMany({
      where: {
        storeId: storeId,
        active: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ services })

  } catch (error) {
    console.error("Erro ao buscar serviços:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar serviço
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    // Verificar se o usuário é dono da loja ou admin
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    if (store.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createServiceSchema.parse(body)

    const service = await prisma.service.create({
      data: {
        ...data,
        storeId: storeId
      }
    })

    return NextResponse.json({
      message: "Serviço criado com sucesso",
      service
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao criar serviço:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}