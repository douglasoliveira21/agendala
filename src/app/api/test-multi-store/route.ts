import { NextRequest, NextResponse } from "next/server"
import { wapiWhatsappService } from "@/lib/whatsapp-wapi"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as lojas com suas sessões WhatsApp
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        whatsappSessionId: true,
        whatsappConnected: true
      },
      take: 5 // Limitar para teste
    })

    const storeStatuses = []

    for (const store of stores) {
      let sessionStatus = null
      let whatsappSession = null

      if (store.whatsappSessionId) {
        // Verificar status da sessão
        sessionStatus = await wapiWhatsappService.getSessionStatus(store.id)
        
        // Buscar dados da sessão no banco
        whatsappSession = await prisma.whatsAppSession.findUnique({
          where: { storeId: store.id }
        })
      }

      storeStatuses.push({
        storeId: store.id,
        storeName: store.name,
        hasSession: !!store.whatsappSessionId,
        sessionId: store.whatsappSessionId,
        connectedInStore: store.whatsappConnected,
        sessionStatus,
        whatsappSession
      })
    }

    return NextResponse.json({
      success: true,
      message: "Status das sessões WhatsApp por loja",
      stores: storeStatuses,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Test Multi-Store] Erro:', error)
    return NextResponse.json({
      success: false,
      error: "Erro ao verificar status das lojas",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, action } = body

    if (!storeId) {
      return NextResponse.json({
        success: false,
        error: "storeId é obrigatório"
      }, { status: 400 })
    }

    // Verificar se a loja existe
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true }
    })

    if (!store) {
      return NextResponse.json({
        success: false,
        error: "Loja não encontrada"
      }, { status: 404 })
    }

    let result = null

    switch (action) {
      case 'create':
        result = await wapiWhatsappService.createSession(storeId)
        break
      
      case 'qr':
        result = await wapiWhatsappService.getQRCode(storeId)
        break
      
      case 'connect':
        result = await wapiWhatsappService.connectSession(storeId)
        break
      
      case 'disconnect':
        result = await wapiWhatsappService.disconnectSession(storeId)
        break
      
      case 'delete':
        result = await wapiWhatsappService.deleteSession(storeId)
        break
      
      case 'status':
        result = await wapiWhatsappService.getSessionStatus(storeId)
        break
      
      default:
        return NextResponse.json({
          success: false,
          error: "Ação inválida. Use: create, qr, connect, disconnect, delete, status"
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Ação '${action}' executada para loja ${store.name}`,
      storeId,
      storeName: store.name,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Test Multi-Store] Erro:', error)
    return NextResponse.json({
      success: false,
      error: "Erro ao executar ação",
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}