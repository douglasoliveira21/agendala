'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Appointment {
  id: string
  date: string
  status: string
  clientName: string
  clientEmail: string
  clientPhone: string
  notes?: string
  totalPrice: number
  store: {
    id: string
    name: string
    slug: string
    phone?: string
    address?: string
    city?: string
    state?: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
}

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Não compareceu'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-gray-100 text-gray-800'
}

export default function AppointmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchAppointment(params.id as string)
    }
  }, [params.id])

  const fetchAppointment = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointment/${id}`)
      
      if (!response.ok) {
        throw new Error('Agendamento não encontrado')
      }
      
      const data = await response.json()
      setAppointment(data.appointment)
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error)
      setError('Agendamento não encontrado')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando detalhes do agendamento...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Agendamento não encontrado'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const appointmentDate = new Date(appointment.date)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Agendamento</h1>
            <p className="text-gray-600">ID: {appointment.id}</p>
          </div>
        </div>
        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
          {statusLabels[appointment.status as keyof typeof statusLabels]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Informações do Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Data</p>
                <p className="text-gray-600">
                  {format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Horário</p>
                <p className="text-gray-600">
                  {format(appointmentDate, 'HH:mm')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Valor Total</p>
                <p className="text-gray-600">
                  R$ {(appointment.totalPrice && !isNaN(appointment.totalPrice) ? appointment.totalPrice : 0).toFixed(2)}
                </p>
              </div>
            </div>

            {appointment.notes && (
              <div className="flex items-start space-x-3">
                <FileText className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">Observações</p>
                  <p className="text-gray-600">{appointment.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Nome</p>
                <p className="text-gray-600">{appointment.clientName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-gray-600">{appointment.clientEmail}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-gray-600">{appointment.clientPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Nome do Serviço</p>
              <p className="text-gray-600">{appointment.service.name}</p>
            </div>

            <div>
              <p className="font-medium">Duração</p>
              <p className="text-gray-600">{appointment.service.duration} minutos</p>
            </div>

            <div>
              <p className="font-medium">Preço</p>
              <p className="text-gray-600">R$ {(appointment.service.price && !isNaN(appointment.service.price) ? appointment.service.price : 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Nome da Loja</p>
              <p className="text-gray-600">{appointment.store.name}</p>
            </div>

            {appointment.store.phone && (
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-gray-600">{appointment.store.phone}</p>
              </div>
            )}

            {appointment.store.address && (
              <div>
                <p className="font-medium">Endereço</p>
                <p className="text-gray-600">
                  {appointment.store.address}
                  {appointment.store.city && `, ${appointment.store.city}`}
                  {appointment.store.state && ` - ${appointment.store.state}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}