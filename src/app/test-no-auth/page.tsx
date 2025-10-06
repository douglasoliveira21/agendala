'use client';

import { useState } from 'react';

export default function TestNoAuthPage() {
  const [status, setStatus] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const testStoreId = 'test-store-123';

  const connectWhatsApp = async () => {
    try {
      setLoading(true);
      setStatus('Conectando ao WhatsApp...');
      
      const response = await fetch('/api/whatsapp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          storeId: testStoreId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Sucesso: ${data.message}`);
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setStatus(status + '\nQR Code gerado! Escaneie com seu WhatsApp.');
        }
      } else {
        setStatus(`Erro: ${data.error}`);
      }
    } catch (error) {
      setStatus(`Erro de conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setLoading(true);
      setStatus('Verificando status...');
      
      const response = await fetch(`/api/whatsapp-test?storeId=${testStoreId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Status: ${JSON.stringify(data, null, 2)}`);
        setIsConnected(data.connected || false);
      } else {
        setStatus(`Erro: ${data.error}`);
      }
    } catch (error) {
      setStatus(`Erro de conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      setLoading(true);
      setStatus('Desconectando...');
      
      const response = await fetch('/api/whatsapp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          storeId: testStoreId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Sucesso: ${data.message}`);
        setIsConnected(false);
        setQrCode('');
      } else {
        setStatus(`Erro: ${data.error}`);
      }
    } catch (error) {
      setStatus(`Erro de conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Teste WhatsApp Sem Autenticação</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={connectWhatsApp}
            disabled={loading || isConnected}
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Conectando...' : 'Conectar WhatsApp'}
          </button>
          
          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Verificando...' : 'Verificar Status'}
          </button>
          
          <button
            onClick={disconnectWhatsApp}
            disabled={loading || !isConnected}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Store ID de teste: <code className="bg-gray-100 px-2 py-1 rounded">{testStoreId}</code>
        </div>
      </div>
      
      {status && (
        <div className="bg-gray-100 p-4 rounded mb-6">
          <h3 className="font-semibold mb-2">Status:</h3>
          <pre className="whitespace-pre-wrap text-sm">{status}</pre>
        </div>
      )}
      
      {qrCode && (
        <div className="bg-white p-4 border rounded">
          <h3 className="font-semibold mb-2">QR Code WhatsApp:</h3>
          <div className="flex flex-col items-center">
            <img src={qrCode} alt="QR Code WhatsApp" className="max-w-xs border" />
            <p className="text-sm text-gray-600 mt-2">
              Escaneie este QR Code com seu WhatsApp para conectar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}