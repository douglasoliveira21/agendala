import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { wapiWhatsappService } from "@/lib/whatsapp-wapi"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(['create', 'connect', 'disconnect', 'delete', 'status', 'qr'])
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { storeId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    // Verificar se o usuário tem acesso à loja
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { ownerId: session.user.id },
          { company: { ownerId: session.user.id } },
          { company: { users: { some: { userId: session.user.id } } } }
        ]
      }
    })

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })
    }

    switch (action) {
      case 'status':
        const status = await wapiWhatsappService.getSessionStatus(storeId)
        const whatsappSession = await prisma.whatsAppSession.findUnique({
          where: { storeId }
        })
        return NextResponse.json({
          success: true,
          status,
          session: whatsappSession
        })

      case 'qr':
        const qrResult = await wapiWhatsappService.getQRCode(storeId)
        return NextResponse.json(qrResult)

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

  } catch (error) {
    console.error('[WhatsApp API] Erro:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { storeId } = await params
    const body = await request.json()
    const { action } = actionSchema.parse(body)

    // Verificar se o usuário tem acesso à loja
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { ownerId: session.user.id },
          { company: { ownerId: session.user.id } },
          { company: { users: { some: { userId: session.user.id } } } }
        ]
      }
    })

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })
    }

    switch (action) {
      case 'create':
        const createResult = await wapiWhatsappService.createSession(storeId)
        return NextResponse.json(createResult)

      case 'connect':
        const connectResult = await wapiWhatsappService.connectSession(storeId)
        return NextResponse.json(connectResult)

      case 'disconnect':
        const disconnectResult = await wapiWhatsappService.disconnectSession(storeId)
        return NextResponse.json(disconnectResult)

      case 'delete':
        const deleteResult = await wapiWhatsappService.deleteSession(storeId)
        return NextResponse.json(deleteResult)

      default:
        return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

  } catch (error) {
    console.error('[WhatsApp API] Erro:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}