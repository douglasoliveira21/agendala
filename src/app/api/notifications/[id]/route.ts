import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/socket'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params
    const body = await req.json()

    if (body.action === 'mark_read') {
      const notification = await notificationService.markAsRead(
        notificationId,
        session.user.id
      )

      return NextResponse.json(notification)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params

    // Deletar a notificação (apenas o próprio usuário pode deletar suas notificações)
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: 'Notificação deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}