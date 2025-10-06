"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Store, Calendar, Settings, BarChart3, Shield, Gift } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  totalStores: number
  totalAppointments: number
  activeStores: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {session.user.name}
              </span>
              <Button variant="outline" onClick={() => router.push("/")}>
                Voltar ao Site
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Clientes, lojistas e admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStores || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeStores || 0} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Funcionando normalmente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Visualizar, editar e gerenciar todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full">Acessar Usuários</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Gerenciar Lojas
              </CardTitle>
              <CardDescription>
                Aprovar, editar e monitorar todas as lojas cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/stores">
                <Button className="w-full">Acessar Lojas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Agendamentos
              </CardTitle>
              <CardDescription>
                Visualizar e gerenciar todos os agendamentos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/appointments">
                <Button className="w-full">Ver Agendamentos</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Relatórios
              </CardTitle>
              <CardDescription>
                Análises detalhadas e relatórios do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button className="w-full">Ver Relatórios</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </CardTitle>
              <CardDescription>
                Configurações globais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/settings">
                <Button className="w-full">Configurações</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Categorias
              </CardTitle>
              <CardDescription>
                Gerenciar categorias de serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button className="w-full">Gerenciar Categorias</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Cupons e Promoções
              </CardTitle>
              <CardDescription>
                Gerenciar cupons de desconto do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/coupons">
                <Button className="w-full">Gerenciar Cupons</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Backup e Restauração
              </CardTitle>
              <CardDescription>
                Backup e restauração de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/backups">
                <Button className="w-full">Gerenciar Backups</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Logs e Auditoria
              </CardTitle>
              <CardDescription>
                Visualizar logs e eventos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/logs">
                <Button className="w-full">Ver Logs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}