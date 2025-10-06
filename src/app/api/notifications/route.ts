import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/socket'
import { z } from 'zod'

const createNotificationSchema = z.object({
  type: z.enum([
    'APPOINTMENT_CREATED',
    'APPOINTMENT_CONFIRMED', 
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_REMINDER',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'SUBSCRIPTION_EXPIRED',
    'SYSTEM_ALERT'
  ]),
  title: z.string().min(1),
  message: z.string().min(1),
  userId: z.string().optional(),
  data: z.any().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      limit
    )

    const unreadCount = await notificationService.getUnreadCount(session.user.id)

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createNotificationSchema.parse(body)

    // Se não especificado, usar o usuário da sessão
    const targetUserId = validatedData.userId || session.user.id

    // Verificar se o usuário tem permissão para criar notificações para outros usuários
    if (targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const notification = await notificationService.createNotification({
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      userId: targetUserId,
      data: validatedData.data,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}