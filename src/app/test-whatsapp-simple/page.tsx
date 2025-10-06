'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, QrCode, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { InlineLoading } from "@/components/ui/loading"

interface WhatsAppStatus {
  storeId: string
  storeName: string
  exists: boolean
  connected: boolean
  qrCode: string | null
  lastSeen: string | null
  localConnected: boolean
}

export default function TestWhatsAppSimplePage() {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const connectWhatsApp = async () => {
    try {
      setConnecting(true)

      // Usar um storeId fixo para teste
      const testStoreId = 'cm2xqhqzr0001u9ecqhqzr001'

      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: testStoreId })
      })

      const data = await response.json()

      if (response.ok) {
        setWhatsappStatus(prev => prev ? {
          ...prev,
          qrCode: data.qrCode,
          connected: false,
          localConnected: false
        } : {
          storeId: testStoreId,
          storeName: 'Loja Teste',
          exists: true,
          connected: false,
          localConnected: false,
          qrCode: data.qrCode,
          lastSeen: null
        })
      } else {
        alert(`Erro: ${data.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error)
      alert(`Erro ao conectar WhatsApp: ${error}`)
    } finally {
      setConnecting(false)
    }
  }

  const loadWhatsAppStatus = async () => {
    try {
      setLoading(true)
      
      // Usar um storeId fixo para teste
      const testStoreId = 'cm2xqhqzr0001u9ecqhqzr001'

      const response = await fetch(`/api/whatsapp?storeId=${testStoreId}`)
      const data = await response.json()

      if (response.ok) {
        setWhatsappStatus(data)
      } else {
        console.error('Erro ao carregar status:', data.error)
        // Criar um status padrão para teste
        setWhatsappStatus({
          storeId: testStoreId,
          storeName: 'Loja Teste',
          exists: false,
          connected: false,
          localConnected: false,
          qrCode: null,
          lastSeen: null
        })
      }
    } catch (error) {
      console.error('Erro ao carregar status do WhatsApp:', error)
      // Criar um status padrão para teste
      setWhatsappStatus({
        storeId: 'cm2xqhqzr0001u9ecqhqzr001',
        storeName: 'Loja Teste',
        exists: false,
        connected: false,
        localConnected: false,
        qrCode: null,
        lastSeen: null
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <InlineLoading text="Carregando..." />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Teste WhatsApp (Sem Auth)</h1>
        <p className="text-muted-foreground">Página de teste para verificar funcionalidade do WhatsApp</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status da Conexão WhatsApp
            </CardTitle>
            <CardDescription>
              Gerencie a conexão do WhatsApp para sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Status da Conexão</p>
                <div className="flex items-center gap-2">
                  {whatsappStatus?.connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <Badge variant="default" className="bg-green-500">
                        Conectado
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">
                        Desconectado
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={loadWhatsAppStatus}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                {!whatsappStatus?.connected && (
                  <Button
                    onClick={connectWhatsApp}
                    disabled={connecting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {connecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {whatsappStatus?.qrCode && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="h-4 w-4" />
                  <span className="font-medium">QR Code para Conexão</span>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={whatsappStatus.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="max-w-xs border rounded"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Escaneie este QR Code com seu WhatsApp para conectar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}