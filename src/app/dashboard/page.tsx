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
  DollarSign, 
  Store, 
  Users, 
  Settings,
  BarChart3,
  Plus,
  Smartphone,
  Key,
  MapPin,
  MessageSquare,
  User,
  TrendingUp
} from "lucide-react"

interface DashboardStats {
  totalAppointments: number
  todayAppointments: number
  totalRevenue: number
  monthlyRevenue: number
  totalServices: number
  activeServices: number
  storeInfo: {
    name: string
    active: boolean
    category: string
  }
}

export default function StoreDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <PageLoading text="Carregando dashboard..." />
  }

  if (!session || session.user.role !== "STORE_OWNER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-6 space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Bem-vindo de volta, <span className="font-medium text-foreground">{session.user.name}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => router.push("/dashboard/appointments/new")}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 rounded-xl font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/dashboard/settings")}
                className="border-border/50 hover:border-primary/50 hover:bg-primary/5 rounded-xl font-medium transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Loja */}
        {stats?.storeInfo && (
          <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center">
                  <Store className="h-6 w-6 mr-3 text-primary" />
                  {stats.storeInfo.name}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <p className="text-muted-foreground font-medium">{stats.storeInfo.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-medium">Status</p>
                  <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                    stats.storeInfo.active 
                      ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                      : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      stats.storeInfo.active ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {stats.storeInfo.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Agendamentos Hoje</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stats?.todayAppointments || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {stats?.totalAppointments || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Receita do Mês</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  R$ {(stats?.monthlyRevenue && !isNaN(stats.monthlyRevenue) ? stats.monthlyRevenue : 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: R$ {(stats?.totalRevenue && !isNaN(stats.totalRevenue) ? stats.totalRevenue : 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Serviços Ativos</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {stats?.activeServices || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total: {stats?.totalServices || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  85%
                </p>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Menu de Navegação
            </h2>
            <p className="text-muted-foreground">Acesse rapidamente as principais funcionalidades</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div 
              onClick={() => router.push("/dashboard/appointments")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Agendamentos</h3>
                  <p className="text-sm text-muted-foreground">Visualize e gerencie todos os agendamentos da sua loja</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/services")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl group-hover:from-green-500/20 group-hover:to-emerald-500/20 transition-all duration-300">
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Serviços</h3>
                  <p className="text-sm text-muted-foreground">Gerencie os serviços oferecidos pela sua loja</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/customers")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl group-hover:from-yellow-500/20 group-hover:to-orange-500/20 transition-all duration-300">
                  <Users className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Clientes</h3>
                  <p className="text-sm text-muted-foreground">Visualize informações dos seus clientes</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/reports")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Relatórios</h3>
                  <p className="text-sm text-muted-foreground">Analise o desempenho da sua loja</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/whatsapp")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                  <Smartphone className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Configure notificações automáticas via WhatsApp</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/settings")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl group-hover:from-pink-500/20 group-hover:to-rose-500/20 transition-all duration-300">
                  <Settings className="h-8 w-8 text-pink-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Configurações</h3>
                  <p className="text-sm text-muted-foreground">Configure as informações da sua loja</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/profile")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl group-hover:from-red-500/20 group-hover:to-pink-500/20 transition-all duration-300">
                  <Users className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Perfil</h3>
                  <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => router.push("/dashboard/api-keys")}
              className="group bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-gray-500/10 to-slate-500/10 rounded-2xl group-hover:from-gray-500/20 group-hover:to-slate-500/20 transition-all duration-300">
                  <Key className="h-8 w-8 text-gray-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">API Keys</h3>
                  <p className="text-sm text-muted-foreground">Gerencie chaves de API para integração com terceiros</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}