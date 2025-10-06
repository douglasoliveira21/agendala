'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Activity, Clock, Globe, Smartphone, Filter, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ApiUsageLog {
  id: string
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  ipAddress: string
  userAgent: string
  timestamp: string
}

interface ApiKey {
  id: string
  name: string
  prefix: string
}

interface LogsData {
  logs: ApiUsageLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    totalRequests: number
    averageResponseTime: number
    statusCodes: Record<string, number>
  }
}

export default function ApiKeyLogsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const keyId = params.keyId as string
  
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [logsData, setLogsData] = useState<LogsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    method: '',
    statusCode: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchApiKey()
    fetchLogs()
  }, [keyId, page])

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchApiKey = async () => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`)
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Erro ao carregar API Key:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== "all"))
      })

      const response = await fetch(`/api/api-keys/${keyId}/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogsData(data)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar logs',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'default'
    if (statusCode >= 400 && statusCode < 500) return 'destructive'
    if (statusCode >= 500) return 'destructive'
    return 'secondary'
  }

  const getMethodBadgeColor = (method: string) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800'
    }
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== "all")),
        export: 'true'
      })

      const response = await fetch(`/api/api-keys/${keyId}/logs?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `api-logs-${keyId}-${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Sucesso',
          description: 'Logs exportados com sucesso'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar logs',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Logs de Uso</h1>
            <p className="text-gray-600">
              {apiKey ? `API Key: ${apiKey.name} (${apiKey.prefix})` : 'Carregando...'}
            </p>
          </div>
        </div>
        
        <Button onClick={exportLogs} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {logsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logsData.stats.totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logsData.stats.averageResponseTime}ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Codes</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(logsData.stats.statusCodes).map(([code, count]) => (
                  <div key={code} className="flex justify-between text-sm">
                    <span>{code}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Método</label>
              <Select value={filters.method} onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status Code</label>
              <Select value={filters.statusCode} onValueChange={(value) => setFilters(prev => ({ ...prev, statusCode: value }))}>
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

            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ method: '', statusCode: '', startDate: '', endDate: '' })}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Requisições</CardTitle>
          <CardDescription>
            {logsData && `${logsData.pagination.total} requisições encontradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsData && logsData.logs.length > 0 ? (
            <div className="space-y-4">
              {logsData.logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getMethodBadgeColor(log.method)}>
                        {log.method}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(log.statusCode)}>
                        {log.statusCode}
                      </Badge>
                      <span className="font-mono text-sm">{log.endpoint}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{log.responseTime}ms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>{log.ipAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="truncate" title={log.userAgent}>
                        {log.userAgent.length > 50 ? `${log.userAgent.substring(0, 50)}...` : log.userAgent}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {logsData.pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  
                  <span className="flex items-center px-3 text-sm">
                    Página {page} de {logsData.pagination.pages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === logsData.pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum log encontrado</h3>
              <p className="text-gray-600">
                Esta API Key ainda não foi utilizada ou não há logs que correspondam aos filtros aplicados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}