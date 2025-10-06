"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
// import { useToast } from "@/hooks/use-toast"
import { 
  Clock,
  Store, 
  Palette, 
  Settings, 
  Save,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Loader2
} from "lucide-react"

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    active: boolean
  }
}

interface StoreSettings {
  id: string
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  primaryColor: string
  secondaryColor: string
  workingHours: WorkingHours
  advanceBookingDays: number
  minAdvanceHours: number
  allowSimpleBooking: boolean
  whatsappNumber: string
  whatsappCountryCode: string
  whatsappAreaCode: string
  whatsappFullNumber: string
  coverImage?: string
  logoImage?: string
}

const defaultWorkingHours: WorkingHours = {
  monday: { start: "09:00", end: "18:00", active: true },
  tuesday: { start: "09:00", end: "18:00", active: true },
  wednesday: { start: "09:00", end: "18:00", active: true },
  thursday: { start: "09:00", end: "18:00", active: true },
  friday: { start: "09:00", end: "18:00", active: true },
  saturday: { start: "09:00", end: "14:00", active: true },
  sunday: { start: "09:00", end: "14:00", active: false }
}

const dayNames = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira", 
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo"
}

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return [`${hour}:00`, `${hour}:30`]
}).flat()

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  // const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState<StoreSettings>({
    id: "",
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    workingHours: defaultWorkingHours,
    advanceBookingDays: 30,
    minAdvanceHours: 2,
    allowSimpleBooking: false,
    whatsappNumber: "",
    whatsappCountryCode: "+55",
    whatsappAreaCode: "",
    whatsappFullNumber: "",
    coverImage: "",
    logoImage: ""
  })

  // Debug: Log settings changes
  useEffect(() => {
    console.log('🔍 [FRONTEND] Settings state changed:')
    console.log('  - logoImage:', settings.logoImage)
    console.log('  - coverImage:', settings.coverImage)
  }, [settings.logoImage, settings.coverImage])

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    loadSettings()
  }, [session, status, router])

  const loadSettings = async () => {
    try {
      console.log('🔍 [FRONTEND] Carregando configurações...')
      const response = await fetch("/api/store/settings")
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [FRONTEND] Configurações carregadas:', JSON.stringify(data, null, 2))
        console.log('🔍 [FRONTEND] Imagens carregadas:')
        console.log('  - logoImage:', data.logoImage)
        console.log('  - coverImage:', data.coverImage)
        setSettings(prev => ({
          ...prev,
          ...data,
          workingHours: data.workingHours || defaultWorkingHours
        }))
      } else {
        console.error('❌ [FRONTEND] Erro ao carregar configurações - Status:', response.status)
        alert("Erro ao carregar configurações")
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Erro ao carregar configurações:", error)
      alert("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      console.log('🔍 [FRONTEND] Iniciando salvamento das configurações')
      console.log('🔍 [FRONTEND] Estado atual das imagens:')
      console.log('  - logoImage:', settings.logoImage)
      console.log('  - coverImage:', settings.coverImage)
      console.log('🔍 [FRONTEND] Dados completos a serem enviados:', JSON.stringify(settings, null, 2))

      const response = await fetch("/api/store/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      })

      console.log('🔍 [FRONTEND] Resposta da API - Status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [FRONTEND] Erro na resposta da API:', errorData)
        throw new Error(errorData.error || 'Erro ao salvar configurações')
      }

      const result = await response.json()
      console.log('✅ [FRONTEND] Configurações salvas com sucesso!')
      console.log('🔍 [FRONTEND] Dados retornados pela API:', JSON.stringify(result, null, 2))
      console.log('🔍 [FRONTEND] Imagens retornadas:')
      console.log('  - logoImage:', result.logoImage)
      console.log('  - coverImage:', result.coverImage)
      
      alert("Configurações salvas com sucesso!")
      
      // Recarregar as configurações para garantir que estão atualizadas
      console.log('🔄 [FRONTEND] Recarregando configurações...')
      await loadSettings()
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao salvar configurações:', error)
      alert(error instanceof Error ? error.message : "Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateWorkingHours = (day: string, field: 'start' | 'end' | 'active', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }))
  }

  const handleWhatsAppChange = (field: 'whatsappCountryCode' | 'whatsappAreaCode' | 'whatsappNumber', value: string) => {
    console.log('🔍 [FRONTEND] WhatsApp field changed:', field, '=', value)
    setSettings(prev => {
      const updated = { ...prev, [field]: value }
      
      // Atualizar whatsappFullNumber automaticamente
      if (updated.whatsappCountryCode && updated.whatsappAreaCode && updated.whatsappNumber) {
        updated.whatsappFullNumber = `${updated.whatsappCountryCode}${updated.whatsappAreaCode}${updated.whatsappNumber}`
      } else {
        updated.whatsappFullNumber = ""
      }
      
      console.log('🔍 [FRONTEND] WhatsApp full number updated:', updated.whatsappFullNumber)
      return updated
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações da Loja</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações e horários de funcionamento da sua loja
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Informações gerais da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Loja</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={settings.description || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua loja..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp (Legado)</Label>
                <Input
                  id="whatsappNumber"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  disabled
                />
              </div>
            </div>

            {/* Campos de WhatsApp Obrigatórios */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">WhatsApp (Obrigatório)</Label>
                <p className="text-sm text-gray-600 mb-3">Configure o WhatsApp da loja para receber notificações</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="whatsappCountryCode">Código do País *</Label>
                  <Input
                    id="whatsappCountryCode"
                    value={settings.whatsappCountryCode}
                    onChange={(e) => handleWhatsAppChange('whatsappCountryCode', e.target.value)}
                    placeholder="+55"
                    maxLength={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappAreaCode">DDD *</Label>
                  <Input
                    id="whatsappAreaCode"
                    value={settings.whatsappAreaCode}
                    onChange={(e) => handleWhatsAppChange('whatsappAreaCode', e.target.value)}
                    placeholder="11"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappNumberNew">Número *</Label>
                  <Input
                    id="whatsappNumberNew"
                    value={settings.whatsappNumber}
                    onChange={(e) => handleWhatsAppChange('whatsappNumber', e.target.value)}
                    placeholder="999999999"
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsappFullNumber">Número Completo</Label>
                  <Input
                    id="whatsappFullNumber"
                    value={settings.whatsappFullNumber}
                    placeholder="+5511999999999"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Campos de Upload de Imagem */}
            <Separator />
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Imagens da Loja</Label>
                <p className="text-sm text-gray-600 mb-3">Adicione imagens para personalizar sua loja</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="logoImage">Logo da Loja</Label>
                  <ImageUpload
                    type="logo"
                    currentImage={settings.logoImage}
                    onUpload={(url) => {
                      console.log('🔍 [FRONTEND] Logo upload callback - URL:', url)
                      setSettings(prev => ({ ...prev, logoImage: url }))
                    }}
                    onRemove={() => {
                      console.log('🔍 [FRONTEND] Logo remove callback')
                      setSettings(prev => ({ ...prev, logoImage: "" }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="coverImage">Imagem de Capa</Label>
                  <ImageUpload
                    type="cover"
                    currentImage={settings.coverImage}
                    onUpload={(url) => {
                      console.log('🔍 [FRONTEND] Cover upload callback - URL:', url)
                      setSettings(prev => ({ ...prev, coverImage: url }))
                    }}
                    onRemove={() => {
                      console.log('🔍 [FRONTEND] Cover remove callback')
                      setSettings(prev => ({ ...prev, coverImage: "" }))
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
            <CardDescription>
              Localização da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={settings.address || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={settings.city || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={settings.state || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={settings.zipCode || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, zipCode: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horários de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de Funcionamento
            </CardTitle>
            <CardDescription>
              Configure os dias e horários que sua loja funciona
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(dayNames).map(([day, dayName]) => (
              <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Switch
                    checked={settings.workingHours[day]?.active || false}
                    onCheckedChange={(checked) => updateWorkingHours(day, 'active', checked)}
                  />
                  <Label className="font-medium">{dayName}</Label>
                </div>
                
                {settings.workingHours[day]?.active && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${day}-start`} className="text-sm">Início:</Label>
                      <Input
                        id={`${day}-start`}
                        type="time"
                        value={settings.workingHours[day]?.start || "09:00"}
                        onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`${day}-end`} className="text-sm">Fim:</Label>
                      <Input
                        id={`${day}-end`}
                        type="time"
                        value={settings.workingHours[day]?.end || "18:00"}
                        onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </>
                )}
                
                {!settings.workingHours[day]?.active && (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configurações de Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configurações de Agendamento
            </CardTitle>
            <CardDescription>
              Configure as regras para agendamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advanceBookingDays">Dias de Antecedência (máximo)</Label>
                <Select
                  value={settings.advanceBookingDays.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, advanceBookingDays: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="minAdvanceHours">Horas de Antecedência (mínimo)</Label>
                <Select
                  value={settings.minAdvanceHours.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, minAdvanceHours: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Imediato</SelectItem>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowSimpleBooking" className="text-base font-medium">
                    Permitir Agendamento Simples
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, os clientes poderão agendar informando apenas nome completo e telefone WhatsApp
                  </p>
                </div>
                <Switch
                  id="allowSimpleBooking"
                  checked={settings.allowSimpleBooking}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowSimpleBooking: checked }))}
                />
              </div>
              
              {settings.allowSimpleBooking && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Agendamento Simples ativado:</strong> Os clientes terão a opção de escolher entre cadastro simples (nome + WhatsApp) ou cadastro completo (todos os dados).
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personalização Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização Visual
            </CardTitle>
            <CardDescription>
              Customize as cores da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#1F2937"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}