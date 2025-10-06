import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a sessão mais recente para o storeId
    const session = await prisma.whatsAppSession.findFirst({
      where: { storeId },
      orderBy: { lastSeen: 'desc' }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }

    if (!session.qrCode) {
      return NextResponse.json(
        { error: 'QR Code não disponível' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        storeId: session.storeId,
        sessionId: session.sessionId,
        qrCode: session.qrCode,
        connected: session.connected,
        lastSeen: session.lastSeen
      }
    })

  } catch (error) {
    console.error('Erro ao buscar QR code:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}