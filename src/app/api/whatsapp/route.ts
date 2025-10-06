import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { whapiService } from "@/lib/whatsapp-whapi"

// GET - Verificar status do serviço WhatsApp centralizado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar status do serviço Whapi (centralizado)
    const whapiStatus = await whapiService.checkStatus()

    return NextResponse.json({
      connected: whapiStatus.connected,
      exists: true, // Whapi está sempre disponível se configurado
      hasApiKey: true, // Não precisa de configuração por loja
      status: whapiStatus.status,
      centralService: true, // Indica que é um serviço centralizado
      phoneNumber: whapiStatus.phoneNumber || 'Whapi Service'
    })

  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Testar conexão e envio de mensagens via Whapi (serviço centralizado)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'STORE_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, testPhoneNumber } = body

    if (action === 'test_message' && testPhoneNumber) {
      // Testar envio de mensagem
      const testMessage = `🤖 Teste do Sistema de Agendamento

Olá! Esta é uma mensagem de teste do nosso sistema centralizado de WhatsApp.

✅ Serviço funcionando corretamente!
📱 Serviço: Whapi Cloud
🕒 Data/Hora: ${new Date().toLocaleString('pt-BR')}

Este é apenas um teste. Obrigado!`

      const result = await whapiService.sendMessage(
        testPhoneNumber, 
        testMessage
      )

      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem',
        testMode: false,
        result,
        error: result.error
      })
    }

    // Testar conexão com Whapi
    const whapiStatus = await whapiService.checkStatus()

    if (!whapiStatus.connected) {
      return NextResponse.json({ 
        error: 'Serviço WhatsApp indisponível no momento' 
      }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp está funcionando corretamente',
      connected: true,
      centralService: true,
      service: 'Whapi Cloud'
    })

  } catch (error) {
    console.error('Error testing WhatsApp connection:', error)
    return NextResponse.json({ error: 'Erro ao testar conexão WhatsApp' }, { status: 500 })
  }
}

// DELETE - Não necessário para serviço centralizado Whapi
// O serviço está sempre disponível e não precisa ser desconectado por loja