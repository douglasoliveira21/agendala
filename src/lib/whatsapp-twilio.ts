import twilio from 'twilio'
import { prisma } from './prisma'

interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
}

class TwilioWhatsAppService {
  private client: twilio.Twilio
  private config: TwilioConfig

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
    }

    if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
      throw new Error('Twilio credentials not configured properly')
    }

    this.client = twilio(this.config.accountSid, this.config.authToken)
  }

  // Enviar mensagem via Twilio WhatsApp
  async sendMessage(to: string, message: string, storeName?: string, testMode: boolean = false): Promise<any> {
    try {
      // Formatar número para WhatsApp (adicionar whatsapp: prefix)
      const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
      const whatsappFrom = `whatsapp:${this.config.phoneNumber}`

      // Adicionar identificação da loja na mensagem se fornecida
      const finalMessage = storeName 
        ? `${message}\n\n_Mensagem automática - ${storeName}_`
        : message

      if (testMode) {
        // Modo de teste - simula o envio sem enviar realmente
        console.log('MODO TESTE - Mensagem que seria enviada:')
        console.log('Para:', whatsappTo)
        console.log('De:', whatsappFrom)
        console.log('Mensagem:', finalMessage)
        console.log('Status: Simulado com sucesso')
        return { sid: 'test_message_id', status: 'simulated' }
      }

      const messageResponse = await this.client.messages.create({
        body: finalMessage,
        from: whatsappFrom,
        to: whatsappTo
      })

      console.log('Twilio message sent:', messageResponse.sid)
      return messageResponse
    } catch (error) {
      console.error('Error sending Twilio message:', error)
      throw error
    }
  }

  // Verificar status do serviço Twilio
  async getServiceStatus(): Promise<{ status: string; connected: boolean }> {
    try {
      // Testar a conexão fazendo uma chamada simples para a API do Twilio
      await this.client.api.accounts(this.config.accountSid).fetch()
      return { status: 'connected', connected: true }
    } catch (error) {
      console.error('Error checking Twilio status:', error)
      return { status: 'error', connected: false }
    }
  }

  // Buscar informações da loja para personalizar mensagens
  async getStoreInfo(storeId: string): Promise<{ name: string } | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { name: true }
      })
      return store
    } catch (error) {
      console.error('Error getting store info:', error)
      return null
    }
  }

  // Enviar mensagem de confirmação de agendamento
  async sendConfirmationMessage(
    storeId: string, 
    clientPhone: string, 
    clientName: string, 
    serviceName: string, 
    date: string, 
    time: string
  ): Promise<any> {
    const storeInfo = await this.getStoreInfo(storeId)
    const storeName = storeInfo?.name || 'Sistema de Agendamento'

    const message = this.generateConfirmationMessage(storeName, clientName, serviceName, date, time)
    return await this.sendMessage(clientPhone, message, storeName)
  }

  // Enviar mensagem de lembrete
  async sendReminderMessage(
    storeId: string,
    clientPhone: string,
    clientName: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<any> {
    const storeInfo = await this.getStoreInfo(storeId)
    const storeName = storeInfo?.name || 'Sistema de Agendamento'

    const message = this.generateReminderMessage(storeName, clientName, serviceName, date, time)
    return await this.sendMessage(clientPhone, message, storeName)
  }

  // Enviar mensagem de cancelamento
  async sendCancellationMessage(
    storeId: string,
    clientPhone: string,
    clientName: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<any> {
    const storeInfo = await this.getStoreInfo(storeId)
    const storeName = storeInfo?.name || 'Sistema de Agendamento'

    const message = this.generateCancellationMessage(storeName, clientName, serviceName, date, time)
    return await this.sendMessage(clientPhone, message, storeName)
  }

  // Notificar lojista sobre novo agendamento
  async notifyStoreOwner(
    storeId: string,
    ownerPhone: string,
    clientName: string,
    serviceName: string,
    date: string,
    time: string
  ): Promise<any> {
    const storeInfo = await this.getStoreInfo(storeId)
    const storeName = storeInfo?.name || 'Sua Loja'

    const message = `🔔 *Novo Agendamento!*

📍 *${storeName}*
👤 *Cliente:* ${clientName}
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Acesse o dashboard para mais detalhes.

_Notificação automática do sistema_`

    return await this.sendMessage(ownerPhone, message)
  }

  // Templates de mensagens
  private generateConfirmationMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string): string {
    return `🎉 *Agendamento Confirmado!*

Olá ${clientName}! Seu agendamento foi confirmado com sucesso.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Obrigado por escolher nossos serviços! 😊`
  }

  private generateReminderMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string): string {
    return `⏰ *Lembrete de Agendamento*

Olá ${clientName}! Lembrando que você tem um agendamento amanhã.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Nos vemos em breve! 😊`
  }

  private generateCancellationMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string): string {
    return `❌ *Agendamento Cancelado*

Olá ${clientName}! Seu agendamento foi cancelado.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Para reagendar, entre em contato conosco.`
  }
}

export const twilioWhatsAppService = new TwilioWhatsAppService()