'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotificationCenter } from '@/components/ui/notifications'
import { useNotifications } from '@/hooks/use-notifications'
import { useToast } from '@/hooks/use-toast'

export default function NotificationsPage() {
  const { createNotification } = useNotifications()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'SYSTEM_ALERT',
    title: '',
    message: '',
  })

  const notificationTypes = [
    { value: 'APPOINTMENT_CREATED', label: 'Agendamento Criado' },
    { value: 'APPOINTMENT_CONFIRMED', label: 'Agendamento Confirmado' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Agendamento Cancelado' },
    { value: 'APPOINTMENT_REMINDER', label: 'Lembrete de Agendamento' },
    { value: 'PAYMENT_RECEIVED', label: 'Pagamento Recebido' },
    { value: 'PAYMENT_FAILED', label: 'Falha no Pagamento' },
    { value: 'SUBSCRIPTION_EXPIRED', label: 'Assinatura Expirada' },
    { value: 'SYSTEM_ALERT', label: 'Alerta do Sistema' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.message) {
      toast({
        title: 'Erro',
        description: 'Título e mensagem são obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    
    try {
      await createNotification({
        type: formData.type,
        title: formData.title,
        message: formData.message,
      })

      toast({
        title: 'Sucesso',
        description: 'Notificação criada com sucesso!',
      })

      // Limpar formulário
      setFormData({
        type: 'SYSTEM_ALERT',
        title: '',
        message: '',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar notificação',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const createSampleNotifications = async () => {
    const samples = [
      {
        type: 'APPOINTMENT_CREATED',
        title: 'Novo Agendamento',
        message: 'Você tem um novo agendamento para amanhã às 14:00',
      },
      {
        type: 'PAYMENT_RECEIVED',
        title: 'Pagamento Confirmado',
        message: 'Pagamento de R$ 50,00 foi processado com sucesso',
      },
      {
        type: 'APPOINTMENT_REMINDER',
        title: 'Lembrete',
        message: 'Seu agendamento é em 1 hora. Não se esqueça!',
      },
    ]

    for (const sample of samples) {
      await createNotification(sample)
      // Pequeno delay entre as notificações
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    toast({
      title: 'Sucesso',
      description: 'Notificações de exemplo criadas!',
    })
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie e teste notificações em tempo real
          </p>
        </div>
        <Button onClick={createSampleNotifications} variant="outline">
          Criar Notificações de Exemplo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário para criar notificação */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Notificação</CardTitle>
            <CardDescription>
              Teste o sistema criando notificações personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Notificação</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da notificação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite a mensagem da notificação"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Criando...' : 'Criar Notificação'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informações sobre o sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>
              Entenda o sistema de notificações em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">🔔 Notificações em Tempo Real</h4>
              <p className="text-sm text-muted-foreground">
                As notificações são enviadas instantaneamente usando WebSocket/Socket.IO
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📱 Tipos de Notificação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Agendamentos (criação, confirmação, cancelamento)</li>
                <li>• Pagamentos (sucesso, falha)</li>
                <li>• Lembretes automáticos</li>
                <li>• Alertas do sistema</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⚡ Recursos</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Contador de não lidas</li>
                <li>• Marcar como lida/não lida</li>
                <li>• Deletar notificações</li>
                <li>• Histórico completo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Central de Notificações */}
      <NotificationCenter />
    </div>
  )
}