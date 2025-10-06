'use client'

import { useState, useEffect } from 'react'

interface SessionStatus {
  exists: boolean
  connected: boolean
  qrCode: string | null
  lastSeen: string | null
  localConnected: boolean
  apiConnected: boolean
}

interface ApiResponse {
  success: boolean
  qrCode?: string
  status?: SessionStatus
  error?: string
  message?: string
  storeId?: string
  messages?: {
    confirmation: string
    reminder: string
    cancellation: string
  }
}

export default function TestWApiPage() {
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [testMessages, setTestMessages] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${log}`])
  }

  const loadStatus = async () => {
    try {
      addLog('Carregando status da sessão W-API...')
      const response = await fetch('/api/whatsapp-wapi-test?action=status&storeId=test-store-wapi')
      const data: ApiResponse = await response.json()
      
      if (data.success && data.status) {
        setStatus(data.status)
        setQrCode(data.status.qrCode)
        addLog(`Status carregado: ${data.status.connected ? 'Conectado' : 'Desconectado'}`)
      } else {
        addLog(`Erro ao carregar status: ${data.error}`)
      }
    } catch (error) {
      addLog(`Erro na requisição: ${error.message}`)
    }
  }

  const connectWhatsApp = async () => {
    setLoading(true)
    try {
      addLog('Iniciando conexão W-API...')
      const response = await fetch('/api/whatsapp-wapi-test?action=connect&storeId=test-store-wapi')
      const data: ApiResponse = await response.json()
      
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode)
        addLog('QR Code gerado com sucesso!')
      } else {
        addLog(`Erro: ${data.error}`)
      }
    } catch (error) {
      addLog(`Erro na conexão: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const disconnectWhatsApp = async () => {
    setLoading(true)
    try {
      addLog('Desconectando W-API...')
      const response = await fetch('/api/whatsapp-wapi-test?action=disconnect&storeId=test-store-wapi')
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        setQrCode(null)
        setStatus(null)
        addLog('Desconectado com sucesso!')
      } else {
        addLog(`Erro ao desconectar: ${data.error}`)
      }
    } catch (error) {
      addLog(`Erro na desconexão: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendTestMessage = async () => {
    if (!phoneNumber || !message) {
      addLog('Preencha o número e a mensagem')
      return
    }

    setLoading(true)
    try {
      addLog(`Enviando mensagem para ${phoneNumber}...`)
      const response = await fetch('/api/whatsapp-wapi-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          storeId: 'test-store-wapi',
          to: phoneNumber,
          message: message
        })
      })
      
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        addLog(`Mensagem enviada com sucesso! ID: ${data.messageId || 'N/A'}`)
        setMessage('')
      } else {
        addLog(`Erro ao enviar: ${data.error}`)
      }
    } catch (error) {
      addLog(`Erro no envio: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadTestMessages = async () => {
    try {
      addLog('Carregando mensagens de teste...')
      const response = await fetch('/api/whatsapp-wapi-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-messages',
          storeId: 'test-store-wapi'
        })
      })
      
      const data: ApiResponse = await response.json()
      
      if (data.success && data.messages) {
        setTestMessages(data.messages)
        addLog('Mensagens de teste carregadas!')
      } else {
        addLog(`Erro ao carregar mensagens: ${data.error}`)
      }
    } catch (error) {
      addLog(`Erro: ${error.message}`)
    }
  }

  useEffect(() => {
    loadStatus()
    loadTestMessages()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🚀 Teste W-API WhatsApp
          </h1>

          {/* Status da Conexão */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">📊 Status da Conexão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Existe Sessão:</strong> {status?.exists ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>Conectado (DB):</strong> {status?.connected ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>Conectado (Local):</strong> {status?.localConnected ? '✅ Sim' : '❌ Não'}</p>
              </div>
              <div>
                <p><strong>API Conectada:</strong> {status?.apiConnected ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>Última Atividade:</strong> {status?.lastSeen ? new Date(status.lastSeen).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={loadStatus}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔄 Atualizar Status
            </button>
          </div>

          {/* Controles de Conexão */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🔗 Controles de Conexão</h2>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={connectWhatsApp}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '⏳ Conectando...' : '📱 Conectar WhatsApp'}
              </button>
              <button
                onClick={disconnectWhatsApp}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '⏳ Desconectando...' : '❌ Desconectar'}
              </button>
            </div>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">📱 QR Code</h2>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="border-2 border-gray-300 rounded-lg"
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                />
              </div>
              <p className="text-center mt-3 text-gray-600">
                Escaneie este QR Code com seu WhatsApp
              </p>
            </div>
          )}

          {/* Envio de Mensagens */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">💬 Enviar Mensagem de Teste</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número (com DDD):
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="11999999999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem:
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem de teste..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={sendTestMessage}
                disabled={loading || !phoneNumber || !message}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? '⏳ Enviando...' : '📤 Enviar Mensagem'}
              </button>
            </div>
          </div>

          {/* Mensagens Pré-definidas */}
          {testMessages && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">📝 Mensagens Pré-definidas</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-700">✅ Confirmação:</h3>
                  <pre className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                    {testMessages.confirmation}
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium text-blue-700">⏰ Lembrete:</h3>
                  <pre className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                    {testMessages.reminder}
                  </pre>
                </div>
                <div>
                  <h3 className="font-medium text-red-700">❌ Cancelamento:</h3>
                  <pre className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                    {testMessages.cancellation}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">📋 Logs de Atividade</h2>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <p>Nenhum log ainda...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
            <button
              onClick={() => setLogs([])}
              className="mt-3 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              🗑️ Limpar Logs
            </button>
          </div>

          {/* Informações de Configuração */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">⚙️ Configuração Necessária</h2>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Para usar a W-API, configure no arquivo .env:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>WAPI_BASE_URL</code> - URL da sua instância W-API</li>
                <li><code>WAPI_INSTANCE_ID</code> - ID da sua instância</li>
                <li><code>WAPI_TOKEN</code> - Token de autenticação</li>
              </ul>
              <p className="mt-3 text-orange-700">
                <strong>⚠️ Importante:</strong> Esta é uma implementação de teste. 
                Configure suas credenciais reais da W-API no arquivo .env
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}