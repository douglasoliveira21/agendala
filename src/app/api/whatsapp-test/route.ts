import { NextRequest, NextResponse } from "next/server"
import { whatsappService } from "@/lib/whatsapp"

// POST - Conectar WhatsApp (versão de teste sem autenticação)
export async function POST(request: NextRequest) {
  try {
    const { storeId, action } = await request.json()

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      )
    }

    console.log(`[WhatsApp Test API] Ação: ${action}, Store ID: ${storeId}`)

    if (action === 'connect') {
      // Criar sessão WhatsApp
      const result = await whatsappService.createSession(storeId)

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: "Sessão criada com sucesso",
        qrCode: result.qrCode,
        storeId: storeId
      })
    }

    if (action === 'status') {
      // Verificar status da sessão
      const status = await whatsappService.getSessionStatus(storeId)
      
      return NextResponse.json({
        storeId,
        ...status
      })
    }

    if (action === 'disconnect') {
      // Desconectar sessão
      const result = await whatsappService.destroySession(storeId)
      
      return NextResponse.json({
        message: "Sessão desconectada com sucesso",
        storeId: storeId
      })
    }

    return NextResponse.json(
      { error: "Ação não reconhecida" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Erro na API WhatsApp Test:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}

// GET - Verificar status (versão de teste sem autenticação)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      )
    }

    console.log(`[WhatsApp Test API] Verificando status para Store ID: ${storeId}`)

    // Verificar status da sessão
    const status = await whatsappService.getSessionStatus(storeId)

    return NextResponse.json({
      storeId,
      ...status
    })

  } catch (error) {
    console.error("Erro ao verificar status WhatsApp:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    )
  }
}