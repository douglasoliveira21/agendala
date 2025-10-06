'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  Download,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReportData {
  period: {
    start: string
    end: string
    type: string
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
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6months')
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reports?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
      setError('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [period])

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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive">{error || 'Erro ao carregar dados'}</p>
            <Button onClick={fetchReports} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Período: {format(new Date(reportData.period.start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(reportData.period.end), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
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
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.summary.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">
              Por agendamento concluído
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(reportData.summary.completionRate)}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de cancelamento: {formatPercentage(reportData.summary.cancellationRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com gráficos */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
                <CardDescription>Status dos agendamentos no período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.charts.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.charts.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Agendamentos por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Mês</CardTitle>
                <CardDescription>Evolução mensal dos agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.charts.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="Agendamentos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Serviço Mais Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.topService.name}</div>
                <p className="text-sm text-muted-foreground">
                  {reportData.summary.topService.count} agendamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dia Mais Movimentado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.summary.busyDay.day}</div>
                <p className="text-sm text-muted-foreground">
                  {reportData.summary.busyDay.count} agendamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Conclusão</span>
                    <Badge variant="secondary">{formatPercentage(reportData.summary.completionRate)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taxa de Cancelamento</span>
                    <Badge variant="destructive">{formatPercentage(reportData.summary.cancellationRate)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Mês</CardTitle>
              <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.charts.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Serviço</CardTitle>
              <CardDescription>Análise detalhada de cada serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.charts.serviceStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="serviceName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalAppointments" fill="#3b82f6" name="Agendamentos" />
                  <Bar dataKey="totalRevenue" fill="#10b981" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Diárias</CardTitle>
              <CardDescription>Agendamentos e receita por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.charts.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'appointments' ? 'Agendamentos' : 'Receita'
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#3b82f6" 
                    name="Agendamentos"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}