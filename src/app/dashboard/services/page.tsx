"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  DollarSign,
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Eye,
  EyeOff
} from "lucide-react"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  active: boolean
  _count: {
    appointments: number
  }
}

export default function ServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    fetchServices()
  }, [session, status, router])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/dashboard/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/services/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          active: !currentStatus
        })
      })

      if (response.ok) {
        fetchServices() // Recarregar a lista
      }
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "STORE_OWNER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
                <p className="text-gray-600">
                  Gerencie os serviços oferecidos pela sua loja
                </p>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/dashboard/services/new")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Lista de Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum serviço encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? "Tente ajustar o termo de busca"
                      : "Você ainda não possui serviços cadastrados"
                    }
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard/services/new")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Serviço
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant={service.active ? "default" : "secondary"}>
                      {service.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          R$ {(service.price && !isNaN(service.price) ? service.price : 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {service._count.appointments} agendamento(s)
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/services/${service.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleServiceStatus(service.id, service.active)}
                      className={service.active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {service.active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
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