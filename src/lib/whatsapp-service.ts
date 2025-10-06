import { create, Whatsapp, Message } from 'venom-bot';
import fs from 'fs';
import path from 'path';

export interface WhatsAppSession {
  id: string;
  client: Whatsapp | null;
  isConnected: boolean;
  qrCode: string | null;
  lastActivity: Date;
}

export interface MessageTemplate {
  type: 'confirmation' | 'reminder' | 'custom';
  template: string;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private readonly sessionsDir = path.join(process.cwd(), 'whatsapp-sessions');

  constructor() {
    // Criar diretório de sessões se não existir
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  async createSession(sessionId: string): Promise<WhatsAppSession> {
    try {
      // Verificar se a sessão já existe
      if (this.sessions.has(sessionId)) {
        const existingSession = this.sessions.get(sessionId)!;
        if (existingSession.isConnected) {
          return existingSession;
        }
      }

      const session: WhatsAppSession = {
        id: sessionId,
        client: null,
        isConnected: false,
        qrCode: null,
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, session);

      // Configurar venom-bot
      const client = await create({
        session: sessionId,
        multidevice: true,
        folderNameToken: this.sessionsDir,
        mkdirFolderToken: this.sessionsDir,
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        browserWS: '',
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        autoClose: 60000,
        createPathFileToken: true,
      }, 
      // Callback para capturar QR Code
      (base64Qr: string, asciiQR: string) => {
        console.log('QR Code gerado para sessão:', sessionId);
        session.qrCode = base64Qr;
        
        // Salvar QR code em arquivo para debug
        const qrPath = path.join(process.cwd(), `qrcode-${sessionId}.txt`);
        fs.writeFileSync(qrPath, `QR Code para sessão ${sessionId}:\n${asciiQR}\n\nBase64: ${base64Qr}`);
      },
      // Callback para status
      (statusSession: string) => {
        console.log('Status da sessão', sessionId, ':', statusSession);
        
        if (statusSession === 'isLogged') {
          session.isConnected = true;
          session.qrCode = null;
          session.lastActivity = new Date();
          console.log('WhatsApp conectado com sucesso para sessão:', sessionId);
        } else if (statusSession === 'qrReadError' || statusSession === 'autocloseCalled') {
          session.isConnected = false;
          session.qrCode = null;
        }
      });

      session.client = client;
      session.lastActivity = new Date();

      return session;
    } catch (error) {
      console.error('Erro ao criar sessão WhatsApp:', error);
      throw new Error(`Falha ao criar sessão WhatsApp: ${error}`);
    }
  }

  async getSession(sessionId: string): Promise<WhatsAppSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async disconnectSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      if (session.client) {
        await session.client.close();
      }

      // Limpar arquivos da sessão
      const sessionPath = path.join(this.sessionsDir, sessionId);
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      }

      // Remover QR code file se existir
      const qrPath = path.join(process.cwd(), `qrcode-${sessionId}.txt`);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }

      this.sessions.delete(sessionId);
      return true;
    } catch (error) {
      console.error('Erro ao desconectar sessão:', error);
      return false;
    }
  }

  async sendMessage(sessionId: string, to: string, message: string, type: 'CONFIRMATION' | 'REMINDER' | 'CUSTOM' = 'CUSTOM'): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || !session.client || !session.isConnected) {
        throw new Error('Sessão WhatsApp não está conectada');
      }

      // Formatar número de telefone
      const phoneNumber = this.formatPhoneNumber(to);
      
      await session.client.sendText(phoneNumber, message);
      session.lastActivity = new Date();

      // Salvar mensagem no banco de dados
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.whatsAppMessage.create({
          data: {
            storeId: sessionId,
            phone: to,
            message,
            type,
            status: 'SENT',
            sentAt: new Date()
          }
        });
      } catch (dbError) {
        console.error('Erro ao salvar mensagem no banco:', dbError);
        // Não falhar o envio por causa do erro no banco
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  async sendTemplateMessage(
    sessionId: string, 
    to: string, 
    template: MessageTemplate, 
    variables: Record<string, string>
  ): Promise<boolean> {
    try {
      let message = template.template;
      
      // Substituir variáveis no template
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return await this.sendMessage(sessionId, to, message);
    } catch (error) {
      console.error('Erro ao enviar mensagem com template:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    
    // Adicionar @c.us para WhatsApp
    return cleanPhone + '@c.us';
  }

  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  async isSessionConnected(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    return session?.isConnected || false;
  }

  getQRCode(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session?.qrCode || null;
  }

  generateConfirmationMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string): string {
    return `🗓️ *Agendamento Confirmado*

Olá ${clientName}!

Seu agendamento foi confirmado:
📅 Data: ${date}
🕐 Horário: ${time}
🏪 Local: ${storeName}
💼 Serviço: ${serviceName}

Qualquer dúvida, entre em contato conosco.

Obrigado! 😊`;
  }

  generateReminderMessage(storeName: string, clientName: string, serviceName: string, date: string, time: string): string {
    return `⏰ *Lembrete de Agendamento*

Olá ${clientName}!

Lembramos que você tem um agendamento:
📅 Data: ${date}
🕐 Horário: ${time}
🏪 Local: ${storeName}
💼 Serviço: ${serviceName}

Nos vemos em breve! 😊`;
  }

  // Templates padrão de mensagens
  static getDefaultTemplates(): Record<string, MessageTemplate> {
    return {
      confirmation: {
        type: 'confirmation',
        template: `🗓️ *Agendamento Confirmado*

Olá {{clientName}}!

Seu agendamento foi confirmado:
📅 Data: {{date}}
🕐 Horário: {{time}}
🏪 Local: {{storeName}}
💼 Serviço: {{serviceName}}

Qualquer dúvida, entre em contato conosco.

Obrigado! 😊`
      },
      reminder: {
        type: 'reminder',
        template: `⏰ *Lembrete de Agendamento*

Olá {{clientName}}!

Lembramos que você tem um agendamento:
📅 Data: {{date}}
🕐 Horário: {{time}}
🏪 Local: {{storeName}}
💼 Serviço: {{serviceName}}

Nos vemos em breve! 😊`
      },
      cancellation: {
        type: 'custom',
        template: `❌ *Agendamento Cancelado*

Olá {{clientName}},

Seu agendamento foi cancelado:
📅 Data: {{date}}
🕐 Horário: {{time}}

Para reagendar, entre em contato conosco.

Obrigado pela compreensão.`
      }
    };
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
export default whatsappService;