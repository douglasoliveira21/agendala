interface WhapiConfig {
  baseUrl: string;
  token: string;
}

interface WhapiMessage {
  to: string;
  body: string;
  typing_time?: number;
}

interface WhapiResponse {
  sent: boolean;
  id?: string;
  message?: string;
  error?: string;
}

export class WhapiService {
  private config: WhapiConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud',
      token: process.env.WHAPI_TOKEN || '',
    };

    if (!this.config.token) {
      throw new Error('WHAPI_TOKEN não configurado nas variáveis de ambiente');
    }
  }

  /**
   * Envia uma mensagem de texto via Whapi
   */
  async sendMessage(to: string, message: string): Promise<WhapiResponse> {
    try {
      console.log('📱 Enviando mensagem via Whapi:', { to, message: message.substring(0, 50) + '...' });

      // Formatar número para padrão internacional
      const formattedNumber = this.formatPhoneNumber(to);
      
      const payload: WhapiMessage = {
        to: formattedNumber,
        body: message,
        typing_time: 1 // Simula digitação por 1 segundo
      };

      const response = await fetch(`${this.config.baseUrl}/messages/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro na resposta da Whapi:', data);
        return {
          sent: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      console.log('✅ Mensagem enviada com sucesso via Whapi:', data);

      return {
        sent: true,
        id: data.id || data.message_id,
        message: 'Mensagem enviada com sucesso',
      };

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Whapi:', error);
      return {
        sent: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Verifica o status da conexão com a API Whapi
   */
  async checkStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      console.log('🔍 Verificando status da conexão Whapi...');

      const response = await fetch(`${this.config.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          connected: false,
          message: `Erro ${response.status}: ${errorData.message || response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('✅ Status da Whapi:', data);

      return {
        connected: true,
        message: 'Conectado com sucesso à API Whapi',
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status da Whapi:', error);
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Erro de conexão',
      };
    }
  }

  /**
   * Obtém informações sobre a conta/instância
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error);
      throw error;
    }
  }

  /**
   * Formata número de telefone para o padrão da API Whapi (sem +)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove o + se estiver presente
    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }
    
    // Se não começar com código do país, assume Brasil (55)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Valida se o número está no formato correto
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Número brasileiro deve ter 13 dígitos (55 + DDD + número)
    // ou 11 dígitos (DDD + número)
    return cleaned.length === 13 || cleaned.length === 11;
  }
}

// Instância singleton
let whapiInstance: WhapiService | null = null;

export function getWhapiService(): WhapiService {
  if (!whapiInstance) {
    whapiInstance = new WhapiService();
  }
  return whapiInstance;
}

// Exportação da instância para compatibilidade
export const whapiService = getWhapiService();