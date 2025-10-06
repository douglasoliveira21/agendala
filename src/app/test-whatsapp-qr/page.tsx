'use client'

import { useState } from 'react'

export default function TestWhatsAppQR() {
  const [storeId, setStoreId] = useState('test-store-123')
  const [qrData, setQrData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQR = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/whatsapp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar QR code')
      }

      setQrData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchQR = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/whatsapp-qr?storeId=${storeId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar QR code')
      }

      setQrData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Teste WhatsApp QR Code</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Store ID:
        </label>
        <input
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full max-w-md"
          placeholder="Digite o Store ID"
        />
      </div>

      <div className="space-x-4 mb-6">
        <button
          onClick={generateQR}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Gerando...' : 'Gerar Novo QR Code'}
        </button>
        
        <button
          onClick={fetchQR}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar QR Code Existente'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {qrData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resultado:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Informações da Sessão:</h3>
              <ul className="space-y-1 text-sm">
                <li><strong>Store ID:</strong> {qrData.storeId}</li>
                <li><strong>Conectado:</strong> {qrData.connected ? 'Sim' : 'Não'}</li>
                <li><strong>Última atualização:</strong> {new Date(qrData.lastSeen).toLocaleString()}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">QR Code:</h3>
              {qrData.qrCode ? (
                <img
                  src={`data:image/png;base64,${qrData.qrCode}`}
                  alt="WhatsApp QR Code"
                  className="border border-gray-300 rounded"
                  style={{ maxWidth: '300px', height: 'auto' }}
                />
              ) : (
                <p className="text-gray-500">QR Code não disponível</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}