import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from './use-toast'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  userId: string
  data?: any
  createdAt: Date
}

export function useNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Buscar notificações do servidor
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [])

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        )
        // Atualizar contador se a notificação não estava lida
        const notification = notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }, [notifications])

  // Criar nova notificação
  const createNotification = useCallback(async (notification: {
    type: string
    title: string
    message: string
    userId?: string
    data?: any
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })

      if (response.ok) {
        const newNotification = await response.json()
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Mostrar toast para notificações importantes
        if (['PAYMENT_FAILED', 'SUBSCRIPTION_EXPIRED', 'SYSTEM_ALERT'].includes(notification.type)) {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'PAYMENT_FAILED' ? 'destructive' : 'default',
          })
        }
        
        return newNotification
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
    }
  }, [toast])

  // Simular conexão WebSocket (em produção, usar Socket.IO real)
  useEffect(() => {
    if (!session?.user?.id) return

    // Buscar notificações iniciais
    fetchNotifications()

    // Simular recebimento de notificações em tempo real
    // Em produção, isso seria substituído por Socket.IO
    const interval = setInterval(() => {
      // Verificar se há novas notificações a cada 30 segundos
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifications])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id)
    }
  }, [notifications, markAsRead])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  }
}