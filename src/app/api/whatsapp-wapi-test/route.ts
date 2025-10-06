import { NextRequest, NextResponse } from 'next/server'
import { wapiWhatsappService } from '@/lib/whatsapp-wapi'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const storeId = searchParams.get('storeId') || 'test-store-wapi'

    console.log(`[W-API Test] GET - Action: ${action}, StoreId: ${storeId}`)

    switch (action) {
      case 'status':
        const status = await wapiWhatsappService.getSessionStatus(storeId)
        return NextResponse.json({
          success: true,
          status,
          storeId
        })

      case 'connect':
        const result = await wapiWhatsappService.createSession(storeId)
        
        if (result.error) {
          return NextResponse.json({
            success: false,
            error: result.error,
            storeId
          })
        }

        return NextResponse.json({
          success: true,
          qrCode: result.qrCode,
          storeId,
          message: 'QR Code gerado com sucesso'
        })

      case 'disconnect':
        await wapiWhatsappService.disconnectSession(storeId)
        return NextResponse.json({
          success: true,
          message: 'Sessão desconectada',
          storeId
        })

      case 'destroy':
        await wapiWhatsappService.destroySession(storeId)
        return NextResponse.json({
          success: true,
          message: 'Sessão destruída',
          storeId
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não especificada. Use: status, connect, disconnect, destroy',
          availableActions: ['status', 'connect', 'disconnect', 'destroy']
        })
    }

  } catch (error) {
    console.error('[W-API Test] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, storeId = 'test-store-wapi', to, message } = body

    console.log(`[W-API Test] POST - Action: ${action}, StoreId: ${storeId}`)

    switch (action) {
      case 'send-message':
        if (!to || !message) {
          return NextResponse.json({
            success: false,
            error: 'Parâmetros "to" e "message" são obrigatórios'
          }, { status: 400 })
        }

        const sendResult = await wapiWhatsappService.sendMessage(storeId, to, message)
        return NextResponse.json({
          success: sendResult.success,
          messageId: sendResult.messageId,
          error: sendResult.error,
          storeId
        })

      case 'connect':
        const result = await wapiWhatsappService.createSession(storeId)
        
        if (result.error) {
          return NextResponse.json({
            success: false,
            error: result.error,
            storeId
          })
        }

        return NextResponse.json({
          success: true,
          qrCode: result.qrCode,
          storeId,
          message: 'QR Code gerado com sucesso'
        })

      case 'test-messages':
        // Gerar mensagens de teste
        const confirmationMsg = wapiWhatsappService.generateConfirmationMessage(
          'Loja Teste W-API',
          'João Silva',
          'Corte de Cabelo',
          '15/12/2024',
          '14:30'
        )

        const reminderMsg = wapiWhatsappService.generateReminderMessage(
          'Loja Teste W-API',
          'Maria Santos',
          'Manicure',
          '16/12/2024',
          '10:00'
        )

        const cancellationMsg = wapiWhatsappService.generateCancellationMessage(
          'Loja Teste W-API',
          'Pedro Costa',
          'Massagem',
          '17/12/2024',
          '16:00'
        )

        return NextResponse.json({
          success: true,
          messages: {
            confirmation: confirmationMsg,
            reminder: reminderMsg,
            cancellation: cancellationMsg
          },
          storeId
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não especificada. Use: connect, send-message, test-messages',
          availableActions: ['connect', 'send-message', 'test-messages']
        })
    }

  } catch (error) {
    console.error('[W-API Test] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}