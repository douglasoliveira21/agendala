"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Send, CheckCircle, AlertCircle, RefreshCw, Calendar, Phone, User } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface ReminderAppointment {
  id: string
  clientName: string
  clientPhone: string
  serviceName: string
  storeName: string
  date: string
  time: string
  reminderSent: boolean
  whatsappConnected: boolean
}

interface ReminderData {
  totalAppointments: number
  pendingReminders: number
  sentReminders: number
  appointments: ReminderAppointment[]
}

export default function RemindersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reminderData, setReminderData] = useState<ReminderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (session?.user) {
      fetchStores()
      fetchReminderData()
    }
  }, [session])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        if (data.stores?.length === 1) {
          setSelectedStore(data.stores[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error)
    }
  }

  const fetchReminderData = async () => {
    try {
      setLoading(true)
      const url = selectedStore 
        ? `/api/whatsapp/reminders/schedule?storeId=${selectedStore}`
        : '/api/whatsapp/reminders/schedule'
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReminderData(data)
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar dados de lembretes",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao buscar dados de lembretes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de lembretes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendReminders = async () => {
    try {
      setSending(true)
      const response = await fetch('/api/whatsapp/reminders/schedule', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Lembretes Enviados",
          description: `${result.sentCount} lembretes enviados com sucesso`
        })
        fetchReminderData() // Recarregar dados
      } else {
        toast({
          title: "Erro",
          description: "Falha ao enviar lembretes",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao enviar lembretes:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar lembretes",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lembretes Automáticos</h1>
          <p className="text-muted-foreground">
            Gerencie lembretes automáticos para agendamentos de amanhã
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchReminderData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={sendReminders}
            disabled={sending || !reminderData?.pendingReminders}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Enviando..." : "Enviar Lembretes"}
          </Button>
        </div>
      </div>

      {/* Filtro por loja */}
      {stores.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Filtrar por Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value)
                setTimeout(fetchReminderData, 100)
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Todas as lojas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {reminderData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderData.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                Para amanhã
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lembretes Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {reminderData.pendingReminders}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lembretes Enviados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {reminderData.sentReminders}
              </div>
              <p className="text-xs text-muted-foreground">
                Já enviados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de agendamentos */}
      {reminderData && (
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos para Amanhã</CardTitle>
            <CardDescription>
              Lista de todos os agendamentos que receberão ou já receberam lembretes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reminderData.appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento encontrado para amanhã</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reminderData.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{appointment.clientPhone}</span>
                        </div>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col">
                        <span className="font-medium">{appointment.serviceName}</span>
                        <span className="text-sm text-muted-foreground">
                          {appointment.storeName}
                        </span>
                      </div>
                      
                      <Separator orientation="vertical" className="h-8" />
                      
                      <div className="flex flex-col">
                        <span className="font-medium">{appointment.date}</span>
                        <span className="text-sm text-muted-foreground">
                          {appointment.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!appointment.whatsappConnected ? (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          WhatsApp Desconectado
                        </Badge>
                      ) : appointment.reminderSent ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Lembrete Enviado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}