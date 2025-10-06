"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, Users, Store, DollarSign, Download } from "lucide-react"
import Link from "next/link"

interface OverviewData {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  completionRate: number
  cancellationRate: number
  totalRevenue: number
  totalUsers: number
  totalStores: number
  activeStores: number
}

interface ReportData {
  overview?: OverviewData
  appointments?: any
  revenue?: any
  stores?: any
  users?: any
}

export default function AdminReports() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("overview")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    // Definir datas padrão (último mês)
    const today = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(lastMonth.toISOString().split('T')[0])

    fetchReports()
  }, [session, status, router])

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports()
    }
  }, [reportType, startDate, endDate])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate
      })

      const response = await fetch(`/api/admin/reports?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (!value || isNaN(value)) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(0)
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const exportReport = () => {
    // Implementar exportação de relatório
    console.log("Exportar relatório:", reportType, { startDate, endDate })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
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
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            </div>
            <Button onClick={exportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Relatório
                </label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Visão Geral</SelectItem>
                    <SelectItem value="appointments">Agendamentos</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="stores">Lojas</SelectItem>
                    <SelectItem value="users">Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchReports} className="w-full">
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relatório de Visão Geral */}
        {reportType === "overview" && reportData.overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overview.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.overview.completedAppointments} concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(reportData.overview.completionRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxa de cancelamento: {formatPercentage(reportData.overview.cancellationRate)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.overview.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas agendamentos concluídos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overview.activeStores}</div>
                  <p className="text-xs text-muted-foreground">
                    de {reportData.overview.totalStores} lojas cadastradas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
                <CardDescription>
                  Dados do período de {new Date(startDate).toLocaleDateString("pt-BR")} até {new Date(endDate).toLocaleDateString("pt-BR")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {reportData.overview.totalUsers}
                    </div>
                    <p className="text-sm text-gray-600">Novos Usuários</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {reportData.overview.totalStores}
                    </div>
                    <p className="text-sm text-gray-600">Novas Lojas</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {reportData.overview.totalAppointments}
                    </div>
                    <p className="text-sm text-gray-600">Agendamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Outros tipos de relatório */}
        {reportType !== "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>Relatório de {reportType}</CardTitle>
              <CardDescription>
                Dados detalhados para o período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Relatório detalhado de {reportType} em desenvolvimento
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta funcionalidade será implementada em breve
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}