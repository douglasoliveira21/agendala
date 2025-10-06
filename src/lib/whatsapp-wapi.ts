import { prisma } from './prisma'

interface WApiConfig {
  baseUrl: string
}

interface SessionConfig {
  sessionId: string
  token: string
}

class WApiWhatsAppService {
  private config: WApiConfig

  constructor() {
    this.config = {
      baseUrl: process.env.WAPI_BASE_URL || 'https://www.wasenderapi.com/api'
    }
  }

  private async makeRequest(endpoint: string, sessionConfig: SessionConfig, method: 'GET' | 'POST' | 'HEAD' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.config.baseUrl}/${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionConfig.token}`
      }
    }

    if (data && method === 'POST') {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('WApi request failed:', error)
      throw error
    }
  }

  // Buscar configuração da sessão no banco de dados
  async getStoreSession(storeId: string): Promise<SessionConfig | null> {
    try {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          whatsappSessionId: true,
          whatsappApiKey: true
        }
      })

      if (!store?.whatsappSessionId || !store?.whatsappApiKey) {
        return null
      }

      return {
        sessionId: store.whatsappSessionId,
        token: store.whatsappApiKey
      }
    } catch (error) {
      console.error('Error getting store session:', error)
      return null
    }
  }



  // Enviar mensagem via WaSenderAPI
  async sendMessage(storeId: string, to: string, text: string): Promise<any> {
    const sessionConfig = await this.getStoreSession(storeId)
    
    if (!sessionConfig) {
      throw new Error('WhatsApp session not configured for this store')
    }

    const data = {
      to: to,
      text: text
    }

    return await this.makeRequest('send-message', sessionConfig, 'POST', data)
  }

  // Verificar se a sessão está ativa (usando endpoint de envio como teste)
  async getSessionStatus(storeId: string): Promise<{ status: string; connected: boolean }> {
    const sessionConfig = await this.getStoreSession(storeId)
    
    if (!sessionConfig) {
      return { status: 'not_configured', connected: false }
    }

    try {
      // Teste simples para verificar se a API key é válida
      // Tentamos fazer uma requisição que não envia mensagem mas valida a autenticação
      const response = await fetch(`${this.config.baseUrl}/send-message`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${sessionConfig.token}`
        }
      })

      if (response.ok || response.status === 405) { // 405 = Method Not Allowed, mas autenticação OK
        return { status: 'connected', connected: true }
      } else if (response.status === 401) {
        return { status: 'unauthorized', connected: false }
      } else {
        return { status: 'error', connected: false }
      }
    } catch (error) {
      console.error('Error checking session status:', error)
      return { status: 'error', connected: false }
    }
  }

  // Testar se a API key é válida
  async testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/send-message`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      // Se retornar 405 (Method Not Allowed), significa que o endpoint existe e a autenticação passou
      // Se retornar 401 (Unauthorized), significa que a API key é inválida
      if (response.status === 405) {
        return { valid: true }
      } else if (response.status === 401) {
        return { valid: false, error: 'API key inválida' }
      } else {
        return { valid: false, error: `Status inesperado: ${response.status}` }
      }
    } catch (error) {
      console.error('Error testing API key:', error)
      return { valid: false, error: 'Erro ao testar API key' }
    }
  }

  // Salvar configuração da sessão no banco (para quando o usuário configurar via dashboard)
  async saveSessionConfig(storeId: string, sessionId: string, apiKey: string): Promise<void> {
    try {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          whatsappSessionId: sessionId,
          whatsappApiKey: apiKey,
          whatsappStatus: 'connected'
        }
      })
    } catch (error) {
      console.error('Error saving session config:', error)
      throw error
    }
  }

  // Remover configuração da sessão
  async removeSessionConfig(storeId: string): Promise<void> {
    try {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          whatsappSessionId: null,
          whatsappApiKey: null,
          whatsappStatus: 'disconnected'
        }
      })
    } catch (error) {
      console.error('Error removing session config:', error)
      throw error
    }
  }

  // Mensagens pré-definidas (mantendo compatibilidade)
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

export const wapiWhatsappService = new WApiWhatsAppService()