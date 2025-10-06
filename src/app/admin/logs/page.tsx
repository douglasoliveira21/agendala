"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  Globe,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ApiUsageLog {
  id: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  ipAddress?: string
  userAgent?: string
  createdAt: string
  apiKey: {
    id: string
    name: string
    description?: string
    user: {
      id: string
      name: string
      email: string
    }
  }
}

interface SystemEvent {
  id: string
  type: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "ERROR"
  action: string
  resource?: string
  resourceId?: string
  userId?: string
  userName?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  details?: any
  createdAt: string
}

export default function AdminLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [apiLogs, setApiLogs] = useState<ApiUsageLog[]>([])
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("api-logs")
  
  // Filtros para logs de API
  const [apiFilters, setApiFilters] = useState({
    method: "",
    endpoint: "",
    statusCode: "all",
    apiKeyId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50
  })

  // Filtros para eventos do sistema
  const [systemFilters, setSystemFilters] = useState({
    type: "",
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50
  })

  const [apiKeys, setApiKeys] = useState<Array<{id: string, name: string}>>([])
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([])

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchApiLogs()
    fetchSystemEvents()
    fetchApiKeys()
    fetchUsers()
  }, [session, status, router])

  const fetchApiLogs = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value.toString())
      })

      const response = await fetch(`/api/admin/logs/api?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApiLogs(data.logs)
      }
    } catch (error) {
      console.error("Erro ao carregar logs de API:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de API",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemEvents = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(systemFilters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value.toString())
      })

      const response = await fetch(`/api/admin/logs/system?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSystemEvents(data.events)
      }
    } catch (error) {
      console.error("Erro ao carregar eventos do sistema:", error)
      // Dados simulados para demonstração
      setSystemEvents([
        {
          id: "1",
          type: "LOGIN",
          action: "Usuário fez login",
          userId: "user1",
          userName: "João Silva",
          userEmail: "joao@example.com",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0...",
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          type: "CREATE",
          action: "Agendamento criado",
          resource: "appointment",
          resourceId: "apt123",
          userId: "user2",
          userName: "Maria Santos",
          userEmail: "maria@example.com",
          ipAddress: "192.168.1.101",
          details: { storeId: "store1", serviceId: "service1" },
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "3",
          type: "ERROR",
          action: "Erro de autenticação",
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0...",
          details: { error: "Invalid credentials" },
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ])
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys")
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys.map((key: any) => ({ id: key.id, name: key.name })))
      }
    } catch (error) {
      console.error("Erro ao carregar API keys:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users.map((user: any) => ({ 
          id: user.id, 
          name: user.name, 
          email: user.email 
        })))
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const handleExportLogs = async (type: "api" | "system") => {
    try {
      const endpoint = type === "api" ? "/api/admin/logs/api/export" : "/api/admin/logs/system/export"
      const response = await fetch(endpoint)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${type}-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Sucesso",
          description: "Logs exportados com sucesso!",
        })
      } else {
        throw new Error("Erro ao exportar logs")
      }
    } catch (error) {
      console.error("Erro ao exportar logs:", error)
      toast({
        title: "Erro",
        description: "Erro ao exportar logs",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        {statusCode}
      </Badge>
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {statusCode}
      </Badge>
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        {statusCode}
      </Badge>
    }
    return <Badge variant="outline">{statusCode}</Badge>
  }

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      PATCH: "bg-purple-100 text-purple-800"
    }
    
    return (
      <Badge variant="outline" className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {method}
      </Badge>
    )
  }

  const getEventTypeBadge = (type: string) => {
    const colors = {
      LOGIN: "bg-blue-100 text-blue-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      ERROR: "bg-red-100 text-red-800"
    }
    
    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    )
  }

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando logs...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Activity className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Logs e Auditoria</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => fetchApiLogs()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-logs">Logs de API</TabsTrigger>
            <TabsTrigger value="system-events">Eventos do Sistema</TabsTrigger>
          </TabsList>

          {/* API Logs Tab */}
          <TabsContent value="api-logs" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">Método</Label>
                    <Select value={apiFilters.method} onValueChange={(value) => setApiFilters({...apiFilters, method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os métodos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="200">200 - OK</SelectItem>
                        <SelectItem value="201">201 - Created</SelectItem>
                        <SelectItem value="400">400 - Bad Request</SelectItem>
                        <SelectItem value="401">401 - Unauthorized</SelectItem>
                        <SelectItem value="404">404 - Not Found</SelectItem>
                        <SelectItem value="500">500 - Server Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={apiFilters.endpoint}
                      onChange={(e) => setApiFilters({...apiFilters, endpoint: e.target.value})}
                      placeholder="Ex: /api/appointments"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Code</Label>
                    <Select value={apiFilters.statusCode} onValueChange={(value) => setApiFilters({...apiFilters, statusCode: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="200">200 - OK</SelectItem>
                        <SelectItem value="201">201 - Created</SelectItem>
                        <SelectItem value="400">400 - Bad Request</SelectItem>
                        <SelectItem value="401">401 - Unauthorized</SelectItem>
                        <SelectItem value="404">404 - Not Found</SelectItem>
                        <SelectItem value="500">500 - Server Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Select value={apiFilters.apiKeyId} onValueChange={(value) => setApiFilters({...apiFilters, apiKeyId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as chaves" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {apiKeys.map((key) => (
                          <SelectItem key={key.id} value={key.id}>{key.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={fetchApiLogs}>
                    <Search className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline" onClick={() => handleExportLogs("api")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Logs de API */}
            <div className="space-y-4">
              {apiLogs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum log encontrado
                    </h3>
                    <p className="text-gray-600">
                      Não há logs de API para os filtros selecionados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                apiLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getMethodBadge(log.method)}
                            <span className="font-mono text-sm text-gray-600">{log.endpoint}</span>
                            {getStatusBadge(log.statusCode)}
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatResponseTime(log.responseTime)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <strong>API Key:</strong> {log.apiKey.name}
                            </div>
                            <div>
                              <strong>Usuário:</strong> {log.apiKey.user.name}
                            </div>
                            <div>
                              <strong>IP:</strong> {log.ipAddress || "N/A"}
                            </div>
                            <div>
                              <strong>Data:</strong> {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </div>
                          </div>
                          
                          {log.userAgent && (
                            <div className="mt-2 text-xs text-gray-500 truncate">
                              <Smartphone className="h-3 w-3 inline mr-1" />
                              {log.userAgent}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* System Events Tab */}
          <TabsContent value="system-events" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Tipo de Evento</Label>
                    <Select value={systemFilters.type} onValueChange={(value) => setSystemFilters({...systemFilters, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                        <SelectItem value="CREATE">Criação</SelectItem>
                        <SelectItem value="UPDATE">Atualização</SelectItem>
                        <SelectItem value="DELETE">Exclusão</SelectItem>
                        <SelectItem value="ERROR">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="action">Ação</Label>
                    <Input
                      id="action"
                      value={systemFilters.action}
                      onChange={(e) => setSystemFilters({...systemFilters, action: e.target.value})}
                      placeholder="Ex: Agendamento criado"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="user">Usuário</Label>
                    <Select value={systemFilters.userId} onValueChange={(value) => setSystemFilters({...systemFilters, userId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os usuários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={fetchSystemEvents}>
                    <Search className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline" onClick={() => handleExportLogs("system")}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Eventos do Sistema */}
            <div className="space-y-4">
              {systemEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum evento encontrado
                    </h3>
                    <p className="text-gray-600">
                      Não há eventos do sistema para os filtros selecionados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                systemEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getEventTypeBadge(event.type)}
                            <span className="font-medium text-gray-900">{event.action}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            {event.userName && (
                              <div>
                                <strong>Usuário:</strong> {event.userName}
                              </div>
                            )}
                            {event.userEmail && (
                              <div>
                                <strong>Email:</strong> {event.userEmail}
                              </div>
                            )}
                            {event.ipAddress && (
                              <div>
                                <strong>IP:</strong> {event.ipAddress}
                              </div>
                            )}
                            <div>
                              <strong>Data:</strong> {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </div>
                          </div>
                          
                          {event.resource && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Recurso:</strong> {event.resource}
                              {event.resourceId && ` (ID: ${event.resourceId})`}
                            </div>
                          )}
                          
                          {event.details && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                              <strong>Detalhes:</strong> {JSON.stringify(event.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}