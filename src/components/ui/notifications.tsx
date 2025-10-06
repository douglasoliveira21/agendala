'use client'

import { useState } from 'react'
import { Bell, Check, X, Trash2 } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ScrollArea } from './scroll-area'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_CREATED':
      case 'APPOINTMENT_CONFIRMED':
        return '📅'
      case 'APPOINTMENT_CANCELLED':
        return '❌'
      case 'APPOINTMENT_REMINDER':
        return '⏰'
      case 'PAYMENT_RECEIVED':
        return '💰'
      case 'PAYMENT_FAILED':
        return '⚠️'
      case 'SUBSCRIPTION_EXPIRED':
        return '📋'
      case 'SYSTEM_ALERT':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_FAILED':
      case 'SUBSCRIPTION_EXPIRED':
        return 'destructive'
      case 'PAYMENT_RECEIVED':
      case 'APPOINTMENT_CONFIRMED':
        return 'default'
      case 'APPOINTMENT_REMINDER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          <ScrollArea className="h-96">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                getIcon={getNotificationIcon}
                getColor={getNotificationColor}
              />
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: string) => string
  getColor: (type: string) => string
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  getIcon, 
  getColor 
}: NotificationItemProps) {
  return (
    <div className={`p-3 border-b last:border-b-0 ${!notification.read ? 'bg-muted/50' : ''}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{getIcon(notification.type)}</span>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">
              {notification.title}
            </p>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(notification.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant={getColor(notification.type) as any} className="text-xs">
              {notification.type.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const { notifications, loading, markAsRead, deleteNotification } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'APPOINTMENT_CREATED':
      case 'APPOINTMENT_CONFIRMED':
        return '📅'
      case 'APPOINTMENT_CANCELLED':
        return '❌'
      case 'APPOINTMENT_REMINDER':
        return '⏰'
      case 'PAYMENT_RECEIVED':
        return '💰'
      case 'PAYMENT_FAILED':
        return '⚠️'
      case 'SUBSCRIPTION_EXPIRED':
        return '📋'
      case 'SYSTEM_ALERT':
        return '🔔'
      default:
        return '📢'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Central de Notificações</CardTitle>
        <CardDescription>
          Acompanhe todas as suas notificações em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma notificação encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className={!notification.read ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Marcar como lida
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}