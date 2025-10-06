"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, User, Store, Phone, Mail, Search, Filter } from "lucide-react"
import Link from "next/link"

interface Appointment {
  id: string
  date: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  clientName: string
  clientEmail: string
  clientPhone: string
  notes?: string
  totalPrice: number
  client: {
    id: string
    name: string
    email: string
    phone: string
  }
  service: {
    id: string
    name: string
    duration: number
    price: number
    store: {
      id: string
      name: string
      slug: string
    }
  }
  createdAt: string
  updatedAt: string
}

const statusColors = {
  PENDING: "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-700 border border-yellow-300/30",
  CONFIRMED: "bg-gradient-to-r from-blue-400/20 to-cyan-400/20 text-blue-700 border border-blue-300/30",
  CANCELLED: "bg-gradient-to-r from-red-400/20 to-pink-400/20 text-red-700 border border-red-300/30",
  COMPLETED: "bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-700 border border-green-300/30",
  NO_SHOW: "bg-gradient-to-r from-gray-400/20 to-slate-400/20 text-gray-700 border border-gray-300/30"
}

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
  NO_SHOW: "Não Compareceu"
}

export default function AdminAppointments() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchAppointments()
  }, [session, status, router, currentPage, statusFilter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      })
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/admin/appointments?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/appointments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: appointmentId,
          status: newStatus
        })
      })

      if (response.ok) {
        fetchAppointments() // Recarregar lista
      } else {
        console.error("Erro ao atualizar status do agendamento")
      }
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error)
    }
  }

  const filteredAppointments = appointments.filter(appointment =>
    appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.service.store.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(0)
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-muted-foreground text-lg font-medium">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-4 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Agendamentos
                  </h1>
                  <p className="text-white/60 text-sm">Gerencie todos os agendamentos do sistema</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-8 bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-white">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 mr-3">
                <Filter className="h-5 w-5 text-white" />
              </div>
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
                  <Input
                    placeholder="Buscar por cliente, email, serviço ou loja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400/20">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">Todos os status</SelectItem>
                    <SelectItem value="PENDING" className="text-white hover:bg-white/10">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED" className="text-white hover:bg-white/10">Confirmado</SelectItem>
                    <SelectItem value="CANCELLED" className="text-white hover:bg-white/10">Cancelado</SelectItem>
                    <SelectItem value="COMPLETED" className="text-white hover:bg-white/10">Concluído</SelectItem>
                    <SelectItem value="NO_SHOW" className="text-white hover:bg-white/10">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <div className="space-y-6">
          {filteredAppointments.length === 0 ? (
            <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardContent className="text-center py-12">
                <div className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-purple-400" />
                </div>
                <p className="text-white/80 text-lg font-medium">Nenhum agendamento encontrado</p>
                <p className="text-white/60 text-sm mt-2">Tente ajustar os filtros de busca</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-purple-500/10 hover:border-purple-400/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge className={statusColors[appointment.status]}>
                            {statusLabels[appointment.status]}
                          </Badge>
                          <span className="text-sm text-white/60 font-mono">
                            #{appointment.id.slice(-8)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {formatPrice(appointment.totalPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 mr-3">
                              <User className="h-4 w-4 text-blue-400" />
                            </div>
                            <span className="font-medium text-white">{appointment.clientName}</span>
                          </div>
                          <div className="flex items-center text-sm text-white/70">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 mr-3">
                              <Mail className="h-4 w-4 text-purple-400" />
                            </div>
                            {appointment.clientEmail}
                          </div>
                          <div className="flex items-center text-sm text-white/70">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 mr-3">
                              <Phone className="h-4 w-4 text-green-400" />
                            </div>
                            {appointment.clientPhone}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 mr-3">
                              <Store className="h-4 w-4 text-orange-400" />
                            </div>
                            <span className="font-medium text-white">{appointment.service.store.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-white/70">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mr-3">
                              <Calendar className="h-4 w-4 text-indigo-400" />
                            </div>
                            {appointment.service.name}
                          </div>
                          <div className="flex items-center text-sm text-white/70">
                            <div className="p-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-rose-500/20 mr-3">
                              <Clock className="h-4 w-4 text-pink-400" />
                            </div>
                            {formatDate(appointment.date)} ({appointment.service.duration}min)
                          </div>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-white/10">
                          <p className="text-sm text-white/80">
                            <strong className="text-white">Observações:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-3 lg:w-48">
                      <Select
                        value={appointment.status}
                        onValueChange={(value) => updateAppointmentStatus(appointment.id, value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400/20 hover:bg-white/10 transition-all duration-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20">
                          <SelectItem value="PENDING" className="text-white hover:bg-white/10">Pendente</SelectItem>
                          <SelectItem value="CONFIRMED" className="text-white hover:bg-white/10">Confirmado</SelectItem>
                          <SelectItem value="CANCELLED" className="text-white hover:bg-white/10">Cancelado</SelectItem>
                          <SelectItem value="COMPLETED" className="text-white hover:bg-white/10">Concluído</SelectItem>
                          <SelectItem value="NO_SHOW" className="text-white hover:bg-white/10">Não Compareceu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Anterior
            </Button>
            <div className="flex items-center px-6 py-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg">
              <span className="text-white/80 text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}