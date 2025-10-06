"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Settings, Save, Globe, Mail, Clock, Bell, Shield, Palette } from "lucide-react"
import Link from "next/link"
import { PageLoading } from "@/components/ui/loading"

interface SystemSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  contactPhone: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  maxAdvanceBookingDays: number
  minAdvanceHours: number
  defaultBookingDuration: number
  enableNotifications: boolean
  enableSmsNotifications: boolean
  enableEmailNotifications: boolean
  currency: string
  timezone: string
  dateFormat: string
  timeFormat: string
}

export default function AdminSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchSettings()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/settings")
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage("Configurações salvas com sucesso!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      setMessage("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (status === "loading" || loading) {
    return <PageLoading text="Carregando configurações..." />
  }

  if (!session || session.user.role !== "ADMIN" || !settings) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Settings className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting("siteName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email de Contato</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => updateSetting("contactEmail", e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="siteDescription">Descrição do Site</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting("siteDescription", e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Telefone de Contato</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) => updateSetting("contactPhone", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Configurações de Usuário
              </CardTitle>
              <CardDescription>
                Controle de registro e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowRegistration">Permitir Registro</Label>
                  <p className="text-sm text-gray-600">
                    Permitir que novos usuários se registrem no sistema
                  </p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => updateSetting("allowRegistration", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireEmailVerification">Verificação de Email</Label>
                  <p className="text-sm text-gray-600">
                    Exigir verificação de email para novos usuários
                  </p>
                </div>
                <Switch
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => updateSetting("requireEmailVerification", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Configurações de Agendamento
              </CardTitle>
              <CardDescription>
                Configurações padrão para agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxAdvanceBookingDays">Máximo de Dias Antecipados</Label>
                  <Input
                    id="maxAdvanceBookingDays"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.maxAdvanceBookingDays}
                    onChange={(e) => updateSetting("maxAdvanceBookingDays", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="minAdvanceHours">Mínimo de Horas Antecipadas</Label>
                  <Input
                    id="minAdvanceHours"
                    type="number"
                    min="0"
                    max="168"
                    value={settings.minAdvanceHours}
                    onChange={(e) => updateSetting("minAdvanceHours", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultBookingDuration">Duração Padrão (minutos)</Label>
                  <Input
                    id="defaultBookingDuration"
                    type="number"
                    min="15"
                    max="480"
                    value={settings.defaultBookingDuration}
                    onChange={(e) => updateSetting("defaultBookingDuration", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Notificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Controle de notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableNotifications">Habilitar Notificações</Label>
                  <p className="text-sm text-gray-600">
                    Habilitar sistema de notificações
                  </p>
                </div>
                <Switch
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableEmailNotifications">Notificações por Email</Label>
                  <p className="text-sm text-gray-600">
                    Enviar notificações por email
                  </p>
                </div>
                <Switch
                  id="enableEmailNotifications"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => updateSetting("enableEmailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableSmsNotifications">Notificações por SMS</Label>
                  <p className="text-sm text-gray-600">
                    Enviar notificações por SMS
                  </p>
                </div>
                <Switch
                  id="enableSmsNotifications"
                  checked={settings.enableSmsNotifications}
                  onCheckedChange={(checked) => updateSetting("enableSmsNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Configurações de Sistema
              </CardTitle>
              <CardDescription>
                Configurações de localização e formato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => updateSetting("dateFormat", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeFormat">Formato de Hora</Label>
                  <Select value={settings.timeFormat} onValueChange={(value) => updateSetting("timeFormat", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HH:mm">24 horas (HH:mm)</SelectItem>
                      <SelectItem value="hh:mm A">12 horas (hh:mm AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
                  <p className="text-sm text-gray-600">
                    Ativar modo de manutenção do sistema
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                />
              </div>

              {settings.maintenanceMode && (
                <div>
                  <Label htmlFor="maintenanceMessage">Mensagem de Manutenção</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}