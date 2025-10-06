import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { whatsappService } from "@/lib/whatsapp"

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

    // Criar sessão WhatsApp
    const result = await whatsappService.createSession(storeId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Sessão WhatsApp criada com sucesso",
      qrCode: result.qrCode
    })

  } catch (error) {
    console.error("Erro ao conectar WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(
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

    // Verificar status da sessão
    const status = await whatsappService.getSessionStatus(storeId)

    return NextResponse.json(status)

  } catch (error) {
    console.error("Erro ao verificar status WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Desconectar sessão WhatsApp
    await whatsappService.disconnectSession(storeId)

    return NextResponse.json({
      message: "WhatsApp desconectado com sucesso"
    })

  } catch (error) {
    console.error("Erro ao desconectar WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}