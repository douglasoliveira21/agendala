"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageLoading } from "@/components/ui/loading"
import { 
  ArrowLeft,
  Search, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  birthDate?: string
  notes?: string
  createdAt: string
  _count: {
    appointments: number
  }
  appointments: Array<{
    id: string
    date: string
    status: string
    service: {
      name: string
    }
  }>
}

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "STORE_OWNER") {
      fetchCustomers()
    }
  }, [status, session])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/dashboard/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      CONFIRMED: { label: "Confirmado", className: "bg-primary/20 text-primary border-primary/30" },
      COMPLETED: { label: "Concluído", className: "bg-green-500/20 text-green-300 border-green-500/30" },
      CANCELLED: { label: "Cancelado", className: "bg-destructive/20 text-destructive border-destructive/30" }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, className: "bg-muted/20 text-muted-foreground border-muted/30" }
  }

  if (status === "loading" || loading) {
    return <PageLoading text="Carregando clientes..." />
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
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Clientes
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie seus clientes e visualize o histórico de agendamentos
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/dashboard/customers/new")}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>

          {/* Filtros */}
          <div className="pb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card/10 backdrop-blur-md border border-border/20 rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {filteredCustomers.length === 0 ? (
            <Card className="bg-card/10 backdrop-blur-md border-border/20 hover:bg-card/15 transition-all duration-300">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
                  <User className="relative h-16 w-16 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm 
                    ? 'Tente ajustar os filtros para encontrar clientes.'
                    : 'Você ainda não possui clientes cadastrados. Quando os clientes fizerem agendamentos, eles aparecerão aqui.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="bg-card/10 backdrop-blur-md border-border/20 hover:bg-card/15 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Informações do Cliente */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center text-muted-foreground">
                              <Phone className="h-4 w-4 mr-2" />
                              {customer.phone}
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <User className="h-4 w-4 mr-2" />
                            {customer._count.appointments} agendamento(s)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Últimos Agendamentos */}
                    {customer.appointments.length > 0 && (
                      <div className="flex-1 max-w-md">
                        <h4 className="text-sm font-medium text-foreground mb-2">Últimos agendamentos:</h4>
                        <div className="space-y-2">
                          {customer.appointments.slice(0, 3).map((appointment) => {
                            const status = getStatusBadge(appointment.status)
                            return (
                              <div key={appointment.id} className="flex items-center justify-between p-2 bg-card/5 rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">{appointment.service.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <Badge className={`${status.className} text-xs`}>
                                  {status.label}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                        className="bg-card/10 border-border/20 text-foreground hover:bg-card/20 hover:border-border/30 transition-all duration-300"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
                        className="bg-card/10 border-border/20 text-foreground hover:bg-card/20 hover:border-border/30 transition-all duration-300"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
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