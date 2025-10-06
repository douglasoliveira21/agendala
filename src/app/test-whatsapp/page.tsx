'use client'

import { useState } from 'react'

export default function TestWhatsAppPage() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const testWhatsAppConnection = async () => {
    setLoading(true)
    setStatus('Testando conexão...')
    
    try {
      // Teste direto da API sem autenticação
      const response = await fetch('/api/whatsapp?storeId=test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.text()
      setStatus(`Resposta: ${response.status} - ${data}`)
    } catch (error) {
      setStatus(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testConnectWhatsApp = async () => {
    setLoading(true)
    setStatus('Testando conexão WhatsApp...')
    
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: 'test' })
      })
      
      const data = await response.text()
      setStatus(`Resposta: ${response.status} - ${data}`)
    } catch (error) {
      setStatus(`Erro: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste WhatsApp</h1>
      
      <div className="space-y-4">
        <button
          onClick={testWhatsAppConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Status WhatsApp'}
        </button>
        
        <button
          onClick={testConnectWhatsApp}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testando...' : 'Testar Conectar WhatsApp'}
        </button>
      </div>
      
      {status && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Status:</h3>
          <pre className="mt-2 text-sm">{status}</pre>
        </div>
      )}
    </div>
  )
}