'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Info,
  AlertCircle,
  Phone,
  Settings
} from 'lucide-react'

interface WhatsAppStatus {
  connected: boolean
  exists: boolean
  hasApiKey: boolean
  status?: string
  centralService?: boolean
  phoneNumber?: string
}

export default function WhatsAppPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    connected: false,
    exists: false,
    hasApiKey: false,
    centralService: false
  })
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testingMessage, setTestingMessage] = useState(false)
  const [testPhoneNumber, setTestPhoneNumber] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'STORE_OWNER') {
      router.push('/dashboard')
      return
    }

    loadWhatsAppStatus()
  }, [session, status, router])

  const loadWhatsAppStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp')
      
      if (response.ok) {
        const data = await response.json()
        setWhatsappStatus(data)
      } else {
        console.error('Erro ao carregar status do WhatsApp')
      }
    } catch (error) {
      console.error('Erro ao carregar status do WhatsApp:', error)
    } finally {
      setLoading(false)
    }
  }

  const testWhatsAppConnection = async () => {
    try {
      setTesting(true)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Conexão testada com sucesso!\n\n' + 
              `Status: ${data.status ? 'Conectado' : 'Desconectado'}\n` +
              `Número: ${data.phoneNumber || 'N/A'}`)
        loadWhatsAppStatus()
      } else {
        alert('❌ Erro ao testar conexão: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      alert('❌ Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  const testSendMessage = async () => {
    if (!testPhoneNumber.trim()) {
      alert('Por favor, insira um número de telefone para teste')
      return
    }

    try {
      setTestingMessage(true)
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_message',
          testPhoneNumber: testPhoneNumber
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Mensagem enviada com sucesso!\n\n' + 
              'Número: ' + testPhoneNumber + '\n' +
              'Status: ' + (data.result?.status || 'Enviado') + '\n' +
              'ID da mensagem: ' + (data.result?.sid || 'N/A'))
      } else {
        alert('❌ Erro ao enviar mensagem: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao testar mensagem:', error)
      alert('❌ Erro ao testar mensagem')
    } finally {
      setTestingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp</h1>
          <p className="text-muted-foreground">
            Notificações automáticas via WhatsApp - Serviço Centralizado
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Status do Serviço WhatsApp
          </CardTitle>
          <CardDescription>
            Serviço centralizado de WhatsApp via Whapi Cloud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {whatsappStatus.connected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge variant="default" className="bg-green-500">
                  Serviço Ativo
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <Badge variant="secondary">
                  Verificando...
                </Badge>
              </>
            )}
          </div>

          {whatsappStatus.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Número Central: <strong>{whatsappStatus.phoneNumber}</strong>
              </span>
            </div>
          )}

          {whatsappStatus.centralService && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                ✨ <strong>Serviço Centralizado:</strong> Todas as mensagens são enviadas através do nosso número oficial. 
                Não é necessário configurar WhatsApp individual por loja.
              </p>
            </div>
          )}
            
          <div className="flex gap-2">
            <Button
              onClick={testWhatsAppConnection}
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>
          </div>

          {whatsappStatus.lastSeen && (
            <div className="text-sm text-muted-foreground">
              Última atividade: {new Date(whatsappStatus.lastSeen).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuração do WhatsApp Whapi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração do WhatsApp Whapi
          </CardTitle>
          <CardDescription>
            Serviço WhatsApp via Whapi Cloud - Pronto para uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ Whapi Cloud Configurado:</h4>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>Serviço WhatsApp ativo e funcionando</li>
              <li>Envio de mensagens em tempo real</li>
              <li>Sem necessidade de configuração adicional</li>
              <li>Pronto para enviar mensagens para qualquer número</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Serviço:</strong> Whapi Cloud<br/>
              <strong>Status:</strong> Ativo e configurado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Teste de Mensagem
          </CardTitle>
          <CardDescription>
            Teste o envio de mensagens reais via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="testPhone" className="text-sm font-medium">
              Número de Telefone (formato: +5511999999999)
            </label>
            <input
              id="testPhone"
              type="tel"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+5511999999999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <Button
            onClick={testSendMessage}
            disabled={testingMessage || !testPhoneNumber.trim()}
            className="w-full"
          >
            {testingMessage ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4 mr-2" />
            )}
            Enviar Mensagem de Teste
          </Button>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Envio Real:</strong> Este teste enviará uma mensagem real para o número informado. 
              Certifique-se de que o número está correto e tem WhatsApp ativo.
            </p>
          </div>
        </CardContent>
      </Card>



      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
          <CardDescription>
            Entenda como as notificações automáticas funcionam
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium">Serviço Centralizado</h4>
                <p className="text-sm text-muted-foreground">
                  Utilizamos um número oficial do sistema para enviar todas as mensagens via Whapi Cloud
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium">Notificações Automáticas</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema envia automaticamente mensagens de confirmação, lembretes e cancelamentos para clientes
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium">Notificações para Lojistas</h4>
                <p className="text-sm text-muted-foreground">
                  Lojistas também recebem notificações sobre novos agendamentos e cancelamentos
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Vantagens do Serviço Centralizado</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Não precisa configurar WhatsApp individual por loja</li>
              <li>• Maior confiabilidade e estabilidade</li>
              <li>• Número oficial do sistema para todas as comunicações</li>
              <li>• Gerenciamento centralizado de mensagens</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}