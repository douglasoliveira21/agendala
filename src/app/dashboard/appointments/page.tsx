"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/ui/loading"
import { 
  Calendar, 
  Clock, 
  User, 
  Phone,
  ArrowLeft,
  Filter,
  Search,
  Plus
} from "lucide-react"

interface Appointment {
  id: string
  date: string
  startTime: string
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  notes?: string
  client: {
    name: string
    email: string
    phone?: string
  }
  service: {
    name: string
    duration: number
    price: number
  }
}

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado", 
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado"
}

const statusColors = {
  PENDING: "default",
  CONFIRMED: "default",
  COMPLETED: "default", 
  CANCELLED: "secondary"
} as const

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    fetchAppointments()
  }, [session, status, router])

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/dashboard/appointments")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === "all" || appointment.status === filter
    const matchesSearch = appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatTime = (timeString: string | undefined | null) => {
    if (!timeString) return "--:--"
    return timeString.slice(0, 5)
  }

  if (status === "loading" || loading) {
    return <PageLoading text="Carregando agendamentos..." />
  }

  if (!session || session.user.role !== "STORE_OWNER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header */}
      <div className="bg-card/10 backdrop-blur-md border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 gap-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")}
                className="mr-4 text-foreground hover:bg-accent/10 border-border/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Agendamentos
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie todos os agendamentos da sua loja
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/dashboard/appointments/new")}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card/10 backdrop-blur-md border border-border/20 rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-card/10 backdrop-blur-md border border-border/20 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
            >
              <option value="all" className="bg-background text-foreground">Todos</option>
              <option value="PENDING" className="bg-background text-foreground">Pendentes</option>
              <option value="CONFIRMED" className="bg-background text-foreground">Confirmados</option>
              <option value="COMPLETED" className="bg-background text-foreground">Concluídos</option>
              <option value="CANCELLED" className="bg-background text-foreground">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Lista de Agendamentos */}
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <Card className="bg-card/10 backdrop-blur-md border-border/20 hover:bg-card/15 transition-all duration-300">
              <CardContent className="text-center py-16">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl"></div>
                  <Calendar className="relative h-16 w-16 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm || filter !== "all" 
                    ? "Tente ajustar os filtros de busca para encontrar agendamentos"
                    : "Você ainda não possui agendamentos. Crie seu primeiro agendamento!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-card/10 backdrop-blur-md border-border/20 hover:bg-card/15 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Data, Hora e Status */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2 bg-card/5 rounded-lg px-3 py-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-card/5 rounded-lg px-3 py-2">
                          <Clock className="h-4 w-4 text-accent" />
                          <span className="text-foreground">{formatTime(appointment.startTime)}</span>
                        </div>
                        <Badge 
                          variant={statusColors[appointment.status]}
                          className={`
                            ${appointment.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-700 border border-yellow-300/30' : ''}
                            ${appointment.status === 'CONFIRMED' ? 'bg-primary/20 text-primary border-primary/30' : ''}
                            ${appointment.status === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 border border-emerald-300/30' : ''}
                            ${appointment.status === 'CANCELLED' ? 'bg-destructive/20 text-destructive border-destructive/30' : ''}
                            font-medium px-3 py-1
                          `}
                        >
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      
                      {/* Informações do Cliente e Serviço */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{appointment.client.name}</p>
                              <p className="text-sm text-muted-foreground">{appointment.client.email}</p>
                            </div>
                          </div>
                          {appointment.client.phone && (
                            <div className="flex items-center space-x-3 ml-11">
                              <Phone className="h-4 w-4 text-accent" />
                              <span className="text-foreground">{appointment.client.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                            <h4 className="font-semibold text-foreground mb-2">{appointment.service.name}</h4>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {appointment.service.duration} minutos
                              </span>
                              <span className="font-semibold text-accent">
                                R$ {(appointment.service.price && !isNaN(appointment.service.price) ? appointment.service.price : 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Observações */}
                      {appointment.notes && (
                        <div className="p-4 bg-card/5 rounded-lg border border-border/10">
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Observações:</h5>
                          <p className="text-sm text-foreground">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[140px]">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}
                        className="bg-card/10 border-border/20 text-foreground hover:bg-card/20 hover:border-border/30 transition-all duration-300"
                      >
                        Ver Detalhes
                      </Button>
                      {appointment.status === "PENDING" && (
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}