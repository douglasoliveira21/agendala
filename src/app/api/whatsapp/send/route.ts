import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { whapiService } from "@/lib/whatsapp-whapi"

// POST - Enviar mensagem WhatsApp
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { storeId, phone, message, type = 'CUSTOM' } = await request.json()

    if (!storeId || !phone || !message) {
      return NextResponse.json(
        { error: "storeId, phone e message são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o WhatsApp está conectado (Whapi é centralizado)
    const status = await whapiService.checkStatus()
    if (!status.connected) {
      return NextResponse.json(
        { error: "Serviço WhatsApp não está disponível no momento" },
        { status: 400 }
      )
    }

    // Enviar mensagem
    const result = await whapiService.sendMessage(phone, message)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erro ao enviar mensagem" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Mensagem enviada com sucesso",
      messageId: result.messageId
    })

  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// GET - Listar mensagens enviadas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Buscar mensagens
    const messages = await prisma.whatsAppMessage.findMany({
      where: { storeId },
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.whatsAppMessage.count({
      where: { storeId }
    })

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Erro ao buscar mensagens WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}