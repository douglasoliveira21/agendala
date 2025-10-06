"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PageLoading } from "@/components/ui/loading"

interface WorkingHours {
  [key: string]: {
    start: string
    end: string
    active: boolean
  }
}

interface StoreSettings {
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
  whatsappNumber: string
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

export default function TestSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [settings, setSettings] = useState<StoreSettings>({
    name: "Salão Beleza Total",
    description: "Salão de beleza especializado em cortes, coloração e tratamentos capilares",
    phone: "(11) 99999-9999",
    email: "contato@belezatotal.com",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    workingHours: defaultWorkingHours,
    advanceBookingDays: 30,
    minAdvanceHours: 2,
    whatsappNumber: "(11) 99999-9999"
  })

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("Configurações salvas com sucesso!")
    } catch (error) {
      alert("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateWorkingHours = (day: string, field: string, value: string | boolean) => {
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

  if (loading) {
    return <PageLoading text="Carregando configurações..." />
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações e horários de funcionamento da sua loja</p>
      </div>

      <div className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure as informações principais da sua loja
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
                  placeholder="Nome da sua loja"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua loja e serviços"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@sualore.com"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>
              Informações de localização da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, complemento"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={settings.city}
                  onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={settings.state}
                  onChange={(e) => setSettings(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="SP"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={settings.zipCode}
                  onChange={(e) => setSettings(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="01234-567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horários de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Funcionamento</CardTitle>
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
            <CardTitle>Configurações de Agendamento</CardTitle>
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
          </CardContent>
        </Card>

        {/* Personalização Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Personalização Visual</CardTitle>
            <CardDescription>
              Configure as cores da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#10B981"
                    className="flex-1"
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
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  )
}