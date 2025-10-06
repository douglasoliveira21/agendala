import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { prisma } from './prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  userId: string
  data?: any
  createdAt: Date
}

export class NotificationService {
  private static instance: NotificationService
  private io: ServerIO | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  setIO(io: ServerIO) {
    this.io = io
  }

  async createNotification(notification: {
    type: string
    title: string
    message: string
    userId: string
    data?: any
  }) {
    try {
      const newNotification = await prisma.notification.create({
        data: {
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          userId: notification.userId,
          data: notification.data || null,
        },
      })

      // Enviar notificação em tempo real
      if (this.io) {
        this.io.to(`user:${notification.userId}`).emit('notification', {
          id: newNotification.id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          userId: newNotification.userId,
          data: newNotification.data,
          createdAt: newNotification.createdAt,
        })
      }

      return newNotification
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw error
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: {
          read: true,
        },
      })

      // Notificar que a notificação foi lida
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification:read', {
          id: notificationId,
        })
      }

      return notification
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      throw error
    }
  }

  async getUserNotifications(userId: string, limit = 20) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      throw error
    }
  }

  async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId: userId,
          read: false,
        },
      })
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error)
      throw error
    }
  }
}

export const notificationService = NotificationService.getInstance()