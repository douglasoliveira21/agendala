'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, Clock, MapPin, Phone, Mail, User } from 'lucide-react'

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  status: string
  totalPrice: number
  store: {
    id: string
    name: string
    slug: string
    phone: string
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

export default function ConfirmationPage() {
  const params = useParams()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(0)
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${mins}min`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pendente</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Confirmado</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Cancelado</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Concluído</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Carregando confirmação...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-card backdrop-blur-md rounded-full p-6 border border-border shadow-lg">
              <CheckCircle className="h-12 w-12 text-red-500 mx-auto" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Agendamento não encontrado</h1>
          <p className="text-white/70 mb-8">O agendamento que você está procurando não existe.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AgendaFácil
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-md rounded-full p-6 border border-white/20 inline-block">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
            Agendamento Confirmado!
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Seu agendamento foi criado com sucesso. Você receberá uma confirmação em breve.
          </p>
        </div>

        {/* Appointment Details */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-6">
            <h2 className="text-xl font-semibold mb-2">Detalhes do Agendamento</h2>
            <p className="text-blue-100 font-mono text-sm">ID: {appointment.id}</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Status */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10">
              <span className="text-white/90 font-medium">Status:</span>
              {getStatusBadge(appointment.status)}
            </div>

            {/* Store Info */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                Estabelecimento
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg mr-4">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-medium text-white">{appointment.store.name}</span>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl border border-green-500/20">
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg mr-4">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white/90">{appointment.store.phone}</span>
                </div>
                
                {appointment.store.address && (
                  <div className="flex items-center p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
                    <div className="p-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg mr-4">
                      <MapPin className="w-5 h-5 text-pink-400" />
                    </div>
                    <span className="text-white/90">
                      {appointment.store.address}
                      {appointment.store.city && `, ${appointment.store.city}`}
                      {appointment.store.state && `, ${appointment.store.state}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Info */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                Serviço
              </h3>
              <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white text-lg mb-2">{appointment.service.name}</h4>
                    <div className="flex items-center text-white/70">
                      <div className="p-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded mr-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-sm">{formatDuration(appointment.service.duration)}</span>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-400">
                    {formatPrice(appointment.service.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
                Data e Horário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg mr-4">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{formatDate(appointment.date)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center">
                    <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg mr-4">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
                Seus Dados
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20">
                  <div className="p-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg mr-4">
                    <User className="w-5 h-5 text-pink-400" />
                  </div>
                  <span className="text-white/90">{appointment.clientName}</span>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl border border-green-500/20">
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg mr-4">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white/90">{appointment.clientPhone}</span>
                </div>
                
                {appointment.clientEmail && (
                  <div className="flex items-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                    <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg mr-4">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-white/90">{appointment.clientEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-white/20 pt-6">
              <div className="flex justify-between items-center text-xl font-bold p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                <span className="text-white">Total:</span>
                <span className="text-green-400 text-2xl">{formatPrice(appointment.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all duration-300">
              Voltar ao Início
            </Button>
          </Link>
          
          <Link href={`/store/${appointment.store.slug}`}>
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              Ver Mais Serviços
            </Button>
          </Link>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Informações Importantes
          </h3>
          <ul className="text-white/80 space-y-2 text-sm">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              Chegue com 10 minutos de antecedência
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              Em caso de cancelamento, entre em contato com pelo menos 2 horas de antecedência
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              Você receberá uma confirmação por WhatsApp em breve
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              Guarde este número de agendamento: <strong className="text-white font-mono">{appointment.id}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}