import { whapiService } from './whatsapp-whapi'
import { notificationService } from './socket'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface AppointmentData {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: Date
  startTime: string
  endTime: string
  notes?: string
  service: {
    name: string
    price: number
    duration: number
  }
  store: {
    id: string
    name: string
    phone?: string
    ownerId: string
  }
}

export class AppointmentNotificationService {
  /**
   * Envia todas as notificações relacionadas a um novo agendamento
   */
  async sendAppointmentNotifications(appointment: AppointmentData) {
    try {
      // Enviar notificações internas (dashboard)
      await this.sendInternalNotifications(appointment)
      
      // Enviar notificações via WhatsApp
      await this.sendWhatsAppNotifications(appointment)
      
      console.log('✅ Todas as notificações de agendamento foram enviadas')
    } catch (error) {
      console.error('❌ Erro ao enviar notificações de agendamento:', error)
      throw error
    }
  }

  /**
   * Envia notificações internas para o dashboard
   */
  private async sendInternalNotifications(appointment: AppointmentData) {
    const formattedDate = format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })
    const formattedPrice = appointment.service.price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    // Notificar o lojista
    await notificationService.createNotification({
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Novo Agendamento Recebido',
      message: `${appointment.clientName} agendou ${appointment.service.name} para ${formattedDate} às ${appointment.startTime}`,
      userId: appointment.store.ownerId,
      data: {
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail,
        serviceName: appointment.service.name,
        date: formattedDate,
        time: appointment.startTime,
        price: appointment.service.price,
        formattedPrice
      }
    })

    console.log('✅ Notificação interna enviada para o lojista')
  }

  /**
   * Envia notificações via WhatsApp
   */
  private async sendWhatsAppNotifications(appointment: AppointmentData) {
    const promises = []

    // Enviar confirmação para o cliente
    promises.push(this.sendClientConfirmation(appointment))

    // Enviar notificação para o lojista
    if (appointment.store.phone) {
      promises.push(this.sendStoreNotification(appointment))
    }

    await Promise.allSettled(promises)
  }

  /**
   * Envia confirmação de agendamento para o cliente
   */
  private async sendClientConfirmation(appointment: AppointmentData) {
    try {
      const formattedDate = format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })
      const formattedPrice = appointment.service.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })

      const message = this.getClientConfirmationTemplate({
        clientName: appointment.clientName,
        storeName: appointment.store.name,
        serviceName: appointment.service.name,
        date: formattedDate,
        time: appointment.startTime,
        price: formattedPrice,
        duration: appointment.service.duration
      })

      await whapiService.sendMessage(appointment.clientPhone, message)
      console.log('✅ Confirmação enviada para o cliente:', appointment.clientPhone)
    } catch (error) {
      console.error('❌ Erro ao enviar confirmação para cliente:', error)
      throw error
    }
  }

  /**
   * Envia notificação de novo agendamento para o lojista
   */
  private async sendStoreNotification(appointment: AppointmentData) {
    try {
      const formattedDate = format(appointment.date, 'dd/MM/yyyy', { locale: ptBR })
      const formattedPrice = appointment.service.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })

      const message = this.getStoreNotificationTemplate({
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        clientEmail: appointment.clientEmail || 'Não informado',
        serviceName: appointment.service.name,
        date: formattedDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        price: formattedPrice,
        notes: appointment.notes || 'Nenhuma observação',
        appointmentId: appointment.id
      })

      await whapiService.sendMessage(appointment.store.phone!, message)
      console.log('✅ Notificação enviada para o lojista:', appointment.store.phone)
    } catch (error) {
      console.error('❌ Erro ao enviar notificação para lojista:', error)
      throw error
    }
  }

  /**
   * Template de confirmação para o cliente
   */
  private getClientConfirmationTemplate(data: {
    clientName: string
    storeName: string
    serviceName: string
    date: string
    time: string
    price: string
    duration: number
  }): string {
    return `✅ *Agendamento Confirmado!*

Olá *${data.clientName}*! 👋

Seu agendamento foi confirmado com sucesso:

🏪 *Estabelecimento:* ${data.storeName}
🛍️ *Serviço:* ${data.serviceName}
📅 *Data:* ${data.date}
⏰ *Horário:* ${data.time}
⏱️ *Duração:* ${data.duration} minutos
💰 *Valor:* ${data.price}

📋 *Importante:*
• Chegue com 10 minutos de antecedência
• Em caso de cancelamento, avise com pelo menos 2 horas de antecedência
• Mantenha este número salvo para futuras comunicações

Obrigado por escolher nossos serviços! 🙏

_Mensagem automática do sistema de agendamentos_`
  }

  /**
   * Template de notificação para o lojista
   */
  private getStoreNotificationTemplate(data: {
    clientName: string
    clientPhone: string
    clientEmail: string
    serviceName: string
    date: string
    startTime: string
    endTime: string
    price: string
    notes: string
    appointmentId: string
  }): string {
    return `🔔 *Novo Agendamento Recebido!*

📋 *DADOS DO AGENDAMENTO:*
🆔 *ID:* ${data.appointmentId}
🛍️ *Serviço:* ${data.serviceName}
📅 *Data:* ${data.date}
⏰ *Horário:* ${data.startTime} às ${data.endTime}
💰 *Valor:* ${data.price}

👤 *DADOS DO CLIENTE:*
📝 *Nome:* ${data.clientName}
📞 *Telefone:* ${data.clientPhone}
📧 *Email:* ${data.clientEmail}

📝 *Observações:* ${data.notes}

🎯 *PRÓXIMOS PASSOS:*
• Confirme o agendamento no painel administrativo
• Entre em contato com o cliente se necessário
• Prepare-se para o atendimento

💡 *Dica:* Acesse seu painel para gerenciar este e outros agendamentos.

_Notificação automática do sistema_`
  }
}

// Instância singleton do serviço
export const appointmentNotificationService = new AppointmentNotificationService()