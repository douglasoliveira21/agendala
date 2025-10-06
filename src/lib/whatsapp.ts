import { create, Whatsapp } from 'venom-bot'
import { prisma } from './prisma'

interface WhatsAppSession {
  client: Whatsapp
  storeId: string
  connected: boolean
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map()

  async createSession(storeId: string): Promise<{ qrCode?: string; error?: string }> {
    try {
      const sessionId = `store_${storeId}`
      
      // Verificar se já existe uma sessão ativa
      if (this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId)!
        if (session.connected) {
          return { error: "Sessão já está ativa" }
        }
      }

      let qrCodeData: string | undefined
      let clientInstance: any = null
      console.log(`[WhatsApp] Iniciando criação de sessão para ${storeId}`)

      try {
        clientInstance = await create(
          sessionId,
          (base64Qr, asciiQR) => {
            console.log(`[WhatsApp] QR Code recebido para ${storeId}, tamanho: ${base64Qr.length}`)
            qrCodeData = base64Qr
            
            // Salvar QR code imediatamente no banco
            prisma.whatsAppSession.upsert({
              where: { storeId },
              update: {
                sessionId,
                qrCode: base64Qr,
                connected: false,
                lastSeen: new Date()
              },
              create: {
                sessionId,
                storeId,
                qrCode: base64Qr,
                connected: false
              }
            }).then(() => {
              console.log(`[WhatsApp] QR Code salvo no banco para ${storeId}`)
            }).catch(err => {
              console.error(`[WhatsApp] Erro ao salvar QR Code no banco:`, err)
            })
          },
          (statusSession, session) => {
            console.log(`[WhatsApp] Status da sessão ${storeId}:`, statusSession)
          },
          {
            multidevice: true,
            headless: true,
            devtools: false,
            useChrome: true,
            debug: false,
            logQR: true,
            browserArgs: ['--no-sandbox'],
            autoClose: 120000,
            createPathFileToken: false
          }
        )
      } catch (createError) {
        console.log(`[WhatsApp] Erro na criação inicial (esperado se não logado):`, createError.message)
        // Não é um erro fatal - pode ser "Not Logged" que é normal
      }

      // Aguardar QR code ser gerado
      console.log(`[WhatsApp] Aguardando QR code para ${storeId}...`)
      await new Promise(resolve => setTimeout(resolve, 8000))

      // Se temos QR code, retornar sucesso mesmo sem estar logado
      if (qrCodeData) {
        console.log(`[WhatsApp] QR Code gerado com sucesso para ${storeId}`)
        
        // Salvar sessão no banco
        await prisma.whatsAppSession.upsert({
          where: { storeId },
          update: {
            sessionId,
            qrCode: qrCodeData,
            connected: false,
            lastSeen: new Date()
          },
          create: {
            sessionId,
            storeId,
            qrCode: qrCodeData,
            connected: false
          }
        })

        // Se temos cliente, configurar eventos
        if (clientInstance) {
          // Configurar eventos
          try {
            clientInstance.onStateChange((state) => {
              console.log('Estado mudou:', state)
              if (state === 'CONNECTED') {
                this.handleConnection(sessionId, storeId, clientInstance)
              } else if (state === 'DISCONNECTED') {
                this.handleDisconnection(sessionId, storeId)
              }
            })

            // Armazenar sessão
            this.sessions.set(sessionId, {
              client: clientInstance,
              storeId,
              connected: false
            })
          } catch (eventError) {
            console.log(`[WhatsApp] Erro ao configurar eventos (não crítico):`, eventError.message)
          }
        }

        return { qrCode: qrCodeData }
      }

      return { error: "QR Code não foi gerado" }

    } catch (error) {
      console.error('Erro ao criar sessão WhatsApp:', error)
      return { error: "Erro interno ao criar sessão" }
    }
  }

  private async handleConnection(sessionId: string, storeId: string, client: Whatsapp) {
    try {
      // Atualizar status no banco
      await prisma.whatsAppSession.update({
        where: { storeId },
        data: {
          connected: true,
          qrCode: null,
          lastSeen: new Date()
        }
      })

      // Atualizar loja
      await prisma.store.update({
        where: { id: storeId },
        data: {
          whatsappConnected: true,
          whatsappSessionId: sessionId
        }
      })

      // Atualizar sessão local
      const session = this.sessions.get(sessionId)
      if (session) {
        session.connected = true
      }

      console.log(`WhatsApp conectado para loja ${storeId}`)

    } catch (error) {
      console.error('Erro ao processar conexão:', error)
    }
  }

  private async handleDisconnection(sessionId: string, storeId: string) {
    try {
      // Atualizar status no banco
      await prisma.whatsAppSession.update({
        where: { storeId },
        data: {
          connected: false,
          lastSeen: new Date()
        }
      })

      // Atualizar loja
      await prisma.store.update({
        where: { id: storeId },
        data: {
          whatsappConnected: false
        }
      })

      // Remover sessão local
      this.sessions.delete(sessionId)

      console.log(`WhatsApp desconectado para loja ${storeId}`)

    } catch (error) {
      console.error('Erro ao processar desconexão:', error)
    }
  }

  async sendMessage(storeId: string, phone: string, message: string, type: 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'CUSTOM' = 'CUSTOM') {
    try {
      const sessionId = `store_${storeId}`
      const session = this.sessions.get(sessionId)

      if (!session || !session.connected) {
        throw new Error('Sessão WhatsApp não está conectada')
      }

      // Formatar número de telefone
      const formattedPhone = phone.replace(/\D/g, '')
      const phoneNumber = formattedPhone.includes('@c.us') ? formattedPhone : `${formattedPhone}@c.us`

      // Enviar mensagem
      await session.client.sendText(phoneNumber, message)

      // Salvar no banco
      await prisma.whatsAppMessage.create({
        data: {
          storeId,
          phone: formattedPhone,
          message,
          type,
          status: 'SENT',
          sentAt: new Date()
        }
      })

      return { success: true }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      // Salvar erro no banco
      await prisma.whatsAppMessage.create({
        data: {
          storeId,
          phone: phone.replace(/\D/g, ''),
          message,
          type,
          status: 'FAILED'
        }
      })

      throw error
    }
  }

  async getSessionStatus(storeId: string) {
    try {
      const session = await prisma.whatsAppSession.findUnique({
        where: { storeId }
      })

      const localSession = this.sessions.get(`store_${storeId}`)

      return {
        exists: !!session,
        connected: session?.connected || false,
        qrCode: session?.qrCode,
        lastSeen: session?.lastSeen,
        localConnected: localSession?.connected || false
      }

    } catch (error) {
      console.error('Erro ao verificar status da sessão:', error)
      return {
        exists: false,
        connected: false,
        qrCode: null,
        lastSeen: null,
        localConnected: false
      }
    }
  }

  async disconnectSession(storeId: string) {
    try {
      const sessionId = `store_${storeId}`
      const session = this.sessions.get(sessionId)

      if (session) {
        await session.client.close()
        this.sessions.delete(sessionId)
      }

      await this.handleDisconnection(sessionId, storeId)

      return { success: true }

    } catch (error) {
      console.error('Erro ao desconectar sessão:', error)
      throw error
    }
  }

  // Mensagens pré-definidas
  generateConfirmationMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string) {
    return `🎉 *Agendamento Confirmado!*

Olá ${clientName}! Seu agendamento foi confirmado com sucesso.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Obrigado por escolher nossos serviços! 😊

_Mensagem automática - ${storeName}_`
  }

  generateReminderMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string) {
    return `⏰ *Lembrete de Agendamento*

Olá ${clientName}! Lembrando que você tem um agendamento amanhã.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Nos vemos em breve! 😊

_Mensagem automática - ${storeName}_`
  }

  generateCancellationMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string) {
    return `❌ *Agendamento Cancelado*

Olá ${clientName}! Seu agendamento foi cancelado.

📍 *${storeName}*
🛍️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}

Para reagendar, entre em contato conosco.

_Mensagem automática - ${storeName}_`
  }
}

export const whatsappService = new WhatsAppService()