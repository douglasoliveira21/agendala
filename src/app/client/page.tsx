'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Star,
  Filter,
  Search,
  ChevronRight,
  AlertCircle
} from 'lucide-react'

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  totalPrice: number
  clientName: string
  clientPhone: string
  clientEmail?: string
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

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, completed, cancelled

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/')
      return
    }

    fetchAppointments()
  }, [session, status, router])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      
      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos')
      }
      
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
        return <Badge variant="secondary">Pendente</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-green-600">Confirmado</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-600">Concluído</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-l-yellow-500'
      case 'CONFIRMED':
        return 'border-l-green-500'
      case 'CANCELLED':
        return 'border-l-red-500'
      case 'COMPLETED':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true
    return appointment.status.toLowerCase() === filter.toLowerCase()
  })

  const upcomingAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date)
    const today = new Date()
    return appointmentDate >= today && appointment.status !== 'CANCELLED'
  })

  const completedAppointments = appointments.filter(appointment => 
    appointment.status === 'COMPLETED'
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                AgendaFácil
              </Link>
              <span className="ml-2 text-gray-500">/ Área do Cliente</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {session?.user?.name}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Voltar ao Início</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próximos Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Agendamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Agendamentos
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Todos os agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Serviços Concluídos
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                Serviços finalizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Meus Agendamentos</CardTitle>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="confirmed">Confirmados</option>
                  <option value="completed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all' 
                    ? 'Você ainda não possui agendamentos.' 
                    : `Você não possui agendamentos ${filter === 'pending' ? 'pendentes' : filter === 'confirmed' ? 'confirmados' : filter === 'completed' ? 'concluídos' : 'cancelados'}.`
                  }
                </p>
                <Button asChild>
                  <Link href="/">Encontrar Serviços</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow border-l-4 ${getStatusColor(appointment.status)}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.service.name}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <User className="w-4 h-4 mr-2" />
                          <span className="font-medium">{appointment.store.name}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{appointment.startTime} - {appointment.endTime}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>{appointment.store.phone}</span>
                          </div>
                          
                          {appointment.store.address && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>
                                {appointment.store.address}
                                {appointment.store.city && `, ${appointment.store.city}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {formatPrice(appointment.totalPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDuration(appointment.service.duration)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-sm text-gray-500">
                        ID: {appointment.id}
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/booking/confirmation/${appointment.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/store/${appointment.store.slug}`}>
                            Ver Loja
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}