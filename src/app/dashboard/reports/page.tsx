'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface ReportData {
  period: {
    start: string
    end: string
    type?: string
  }
  summary: {
    totalAppointments: number
    totalRevenue: number
    averageTicket: number
    completionRate: number
    cancellationRate: number
    topService: {
      name: string
      count: number
    }
    busyDay: {
      day: string
      count: number
    }
  }
  charts: {
    dailyStats: Array<{
      date: string
      appointments: number
      revenue: number
      completedAppointments: number
      cancelledAppointments: number
    }>
    monthlyStats: Array<{
      month: string
      appointments: number
      revenue: number
      completedAppointments: number
      cancelledAppointments: number
    }>
    serviceStats: Array<{
      serviceName: string
      totalAppointments: number
      totalRevenue: number
      averagePrice: number
      completionRate: number
    }>
    statusDistribution: Array<{
      name: string
      value: number
      color: string
    }>
  }
  monthlyComparison: {
    currentMonth: {
      appointments: number
      revenue: number
    }
    previousMonth: {
      appointments: number
      revenue: number
    }
    growth: {
      appointments: number
      revenue: number
    }
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('30') // dias

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'STORE_OWNER') {
      router.push('/dashboard')
      return
    }

    // Definir datas padrão (últimos 30 dias)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])

    loadReports(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  }, [session, status, router])

  const loadReports = async (start?: string, end?: string) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (start) params.append('startDate', start)
      if (end) params.append('endDate', end)

      const response = await fetch(`/api/reports?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setReportData(data)
      } else {
        console.error('Erro ao carregar relatórios:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (days: string) => {
    setSelectedPeriod(days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parseInt(days))
    
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    setStartDate(startStr)
    setEndDate(endStr)
    loadReports(startStr, endStr)
  }

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      loadReports(startDate, endDate)
    }
  }

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(0)
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
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
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Analise o desempenho da sua loja
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-2">
              {['7', '15', '30', '90'].map((days) => (
                <Button
                  key={days}
                  variant={selectedPeriod === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(days)}
                >
                  {days} dias
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <Button onClick={handleCustomDateFilter}>
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Agendamentos
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.totalAppointments}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {reportData.monthlyComparison.growth.appointments > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(reportData.monthlyComparison.growth.appointments)}% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {reportData.monthlyComparison.growth.revenue > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(reportData.monthlyComparison.growth.revenue)}% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ticket Médio
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.summary.averageTicket)}</div>
                <p className="text-xs text-muted-foreground">
                  Por agendamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Conclusão
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(reportData.summary.completionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Agendamentos concluídos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas por Serviço */}
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Serviço</CardTitle>
              <CardDescription>
                Análise detalhada de cada serviço oferecido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.charts.serviceStats.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{service.serviceName}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{service.totalAppointments} agendamentos</span>
                        <span>{formatCurrency(service.totalRevenue)} receita</span>
                        <span>{formatPercentage(service.completionRate)} conclusão</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(service.averagePrice)}</div>
                      <div className="text-sm text-muted-foreground">Preço médio</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Agendamentos por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Dia</CardTitle>
                <CardDescription>Evolução diária dos agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.charts.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                      formatter={(value, name) => [value, name === 'appointments' ? 'Agendamentos' : 'Receita']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Agendamentos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Receita por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Dia</CardTitle>
                <CardDescription>Evolução diária da receita</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.charts.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                      formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                    />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Pizza - Status dos Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Proporção de agendamentos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Concluídos', 
                        value: Math.round(reportData.summary.completionRate),
                        color: '#82ca9d'
                      },
                      { 
                        name: 'Cancelados', 
                        value: Math.round(reportData.summary.cancellationRate),
                        color: '#ff6b6b'
                      },
                      { 
                        name: 'Outros', 
                        value: Math.round(100 - reportData.summary.completionRate - reportData.summary.cancellationRate),
                        color: '#ffd93d'
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { color: '#82ca9d' },
                      { color: '#ff6b6b' },
                      { color: '#ffd93d' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Serviço Mais Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.topService.name}</div>
                <p className="text-muted-foreground">
                  {reportData.summary.topService.count} agendamentos no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dia Mais Movimentado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.busyDay.day}</div>
                <p className="text-muted-foreground">
                  {reportData.summary.busyDay.count} agendamentos em média
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Taxa de Cancelamento */}
          {reportData.summary.cancellationRate > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Taxa de Cancelamento</CardTitle>
                <CardDescription>
                  Monitore os cancelamentos para identificar possíveis melhorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatPercentage(reportData.summary.cancellationRate)}
                </div>
                <p className="text-muted-foreground mt-2">
                  Considere implementar políticas de cancelamento ou melhorar a comunicação com os clientes
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}